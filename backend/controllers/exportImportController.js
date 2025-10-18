const User = require('../models/User');
const School = require('../models/School');
const { generateStudentPasswordFromDOB } = require('../utils/passwordGenerator');
const csv = require('csv-parse');
const fs = require('fs');
const { promisify } = require('util');

const parseCsv = promisify(csv.parse);

// Export users to CSV with comprehensive data
exports.exportUsers = async (req, res) => {
  try {
    const { schoolCode } = req.params;
    const { role, format = 'csv' } = req.query;

    // Find school
    const school = await School.findOne({ code: schoolCode });
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Build query
    const query = { schoolId: school._id };
    if (role && role !== 'all') {
      query.role = role;
    }

    // Get users with all related data
    const users = await User.find(query)
      .populate('schoolId', 'name code')
      .lean();

    if (format === 'excel') {
      // For Excel format, we'll return JSON that can be converted to Excel
      return res.json({
        success: true,
        data: users,
        headers: getHeadersForRole(role),
        filename: `${schoolCode}_${role || 'all'}_users_${new Date().toISOString().split('T')[0]}.xlsx`
      });
    }

    // Generate CSV
    const csvContent = generateCSV(users, role);
    const filename = `${schoolCode}_${role || 'all'}_users_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ message: 'Error exporting users', error: error.message });
  }
};

// ==================================================================
// START: MODIFIED FUNCTION
// ==================================================================

// Import users from CSV with comprehensive validation
exports.importUsers = async (req, res) => {
  try {
    const { schoolCode } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Find school
    const school = await School.findOne({ code: schoolCode });
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Parse CSV
    const csvData = await parseCsv(fs.readFileSync(file.path), {
      columns: true,
      trim: true,
      skip_empty_lines: true
    });

    const results = {
      success: [],
      errors: [],
      total: csvData.length
    };

    // ==================================================================
    // NEW LOGIC: Get the last user ID *before* the loop starts
    // We assume a 'student' role import based on your previous errors.
    // ==================================================================
    const rolePrefix = 'S'; // 'S' for 'student'
    const idPrefix = `${schoolCode.toUpperCase()}-${rolePrefix}-`;

    const lastUser = await User.findOne({
      schoolId: school._id,
      role: 'student',
      userId: { $regex: `^${idPrefix}` } // Ensure we get the right format
    }).sort({ userId: -1 }); // Find the user with the highest ID

    let lastIdNumber = 0;
    if (lastUser && lastUser.userId) {
      try {
        const numberPart = lastUser.userId.split('-')[2];
        lastIdNumber = parseInt(numberPart) || 0;
      } catch (e) {
        lastIdNumber = 0; // Default to 0 if parsing fails
      }
    }
    // ==================================================================
    // END: NEW LOGIC
    // ==================================================================


    // Process each row
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNumber = i + 2; // +2 because CSV is 1-indexed and we skip header

      try {
        // Validate required fields based on role
        const validationErrors = validateUserRow(row, rowNumber);
        if (validationErrors.length > 0) {
          results.errors.push(...validationErrors);
          continue;
        }

        const userRole = row['Role*'] || row['Role'] || 'student';

        // Fail-safe if CSV contains mixed roles
        if (userRole !== 'student') {
          results.errors.push({
            row: rowNumber,
            error: `Import failed: This import is optimized for students only, but found role '${userRole}'.`,
            data: row
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({
          email: row['Email*'] || row['Email'],
          schoolId: school._id
        });

        if (existingUser) {
          results.errors.push({
            row: rowNumber,
            error: 'User already exists with this email',
            data: { email: row['Email*'] || row['Email'] }
          });
          continue; // Skip this user, do NOT increment the ID counter
        }

        // ==================================================================
        // MODIFIED LOGIC: Generate ID by incrementing our local counter
        // This avoids calling the async generator function in a loop.
        // ==================================================================
        lastIdNumber++; // Increment the counter *first*
        const userId = `${idPrefix}${lastIdNumber.toString().padStart(4, '0')}`;
        // ==================================================================
        // END: MODIFIED LOGIC
        // ==================================================================

        // Create user data based on role
        const userData = await createUserFromRow(row, school._id, userId, schoolCode);

        // Create user
        const user = new User(userData);
        await user.save();

        results.success.push({
          userId: user.userId,
          email: user.email,
          name: user.name.displayName,
          role: user.role,
          password: userData.temporaryPassword // Return the plain password
        });

      } catch (error) {
        // Check if this was a duplicate ID error.
        if (error.code === 11000) {
          lastIdNumber--; // Decrement to retry this ID number on the next row
          results.errors.push({
            row: rowNumber,
            error: `Duplicate key error (will retry ID): ${error.message}`,
            data: row
          });
        } else {
          results.errors.push({
            row: rowNumber,
            error: error.message,
            data: row
          });
        }
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    res.json({
      success: true,
      message: `Import completed. ${results.success.length} users created, ${results.errors.length} errors.`,
      results
    });

  } catch (error) {
    console.error('Error importing users:', error);
    res.status(500).json({ message: 'Error importing users', error: error.message });
  }
};
// ==================================================================
// END: MODIFIED FUNCTION
// ==================================================================


// Generate template for import
exports.generateTemplate = async (req, res) => {
  try {
    const { schoolCode } = req.params;
    const { role } = req.query;

    const template = generateTemplateForRole(role);
    const filename = `${schoolCode}_${role}_import_template_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(template);

  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ message: 'Error generating template', error: error.message });
  }
};

// Helper functions

function getHeadersForRole(role) {
  const commonHeaders = [
    'User ID', 'First Name', 'Middle Name', 'Last Name', 'Email', 'Phone',
    'Date of Birth', 'Gender', 'Address', 'City', 'State', 'Pin Code',
    'Status', 'Created Date', 'Last Modified'
  ];

  if (role === 'student') {
    return [
      ...commonHeaders,
      'Student ID', 'Admission Number', 'Roll Number', 'Class', 'Section', 'Academic Year',
      'Father Name', 'Mother Name', 'Guardian Name', 'Father Phone', 'Mother Phone',
      'Aadhaar Number', 'Religion', 'Caste', 'Category', 'Disability', 'Is RTE Candidate',
      'Previous School', 'Transport Mode', 'Bank Name', 'Account Number', 'IFSC Code'
    ];
  } else if (role === 'teacher') {
    return [
      ...commonHeaders,
      'Employee ID', 'Designation', 'Department', 'Joining Date', 'Qualification',
      'Experience', 'Subjects', 'Salary', 'Bank Name', 'Account Number', 'IFSC Code'
    ];
  } else if (role === 'admin') {
    return [
      ...commonHeaders,
      'Admin ID', 'Admin Level', 'Designation', 'Department', 'Joining Date',
      'Permissions', 'Access Level', 'Qualification', 'Experience', 'Salary',
      'Bank Name', 'Account Number', 'IFSC Code'
    ];
  }

  return commonHeaders;
}

function generateCSV(users, role) {
  const headers = getHeadersForRole(role);
  const rows = users.map(user => {
    const baseData = [
      user.userId || user._id,
      user.name?.firstName || '',
      user.name?.middleName || '',
      user.name?.lastName || '',
      user.email || '',
      user.phone || '',
      user.studentDetails?.personal?.dateOfBirth || user.teacherDetails?.personal?.dateOfBirth || user.adminDetails?.personal?.dateOfBirth || '',
      user.studentDetails?.personal?.gender || user.teacherDetails?.personal?.gender || user.adminDetails?.personal?.gender || '',
      user.address || '',
      user.city || '',
      user.state || '',
      user.pinCode || '',
      user.status || 'active',
      user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '',
      user.updatedAt ? new Date(user.updatedAt).toISOString().split('T')[0] : ''
    ];

    if (role === 'student') {
      const studentDetails = user.studentDetails || {};
      const personal = studentDetails.personal || {};
      const family = studentDetails.family || {};
      const academic = studentDetails.academic || {};

      return [
        ...baseData,
        studentDetails.studentId || '',
        academic.admissionNumber || '',
        academic.rollNumber || '',
        academic.class || '',
        academic.section || '',
        academic.academicYear || '',
        family.father?.name || '',
        family.mother?.name || '',
        family.guardian?.name || '',
        family.father?.phone || '',
        family.mother?.phone || '',
        personal.aadhaarNumber || '',
        personal.religion || '',
        personal.caste || '',
        personal.category || '',
        personal.disability || '',
        personal.isRTECandidate || 'No',
        academic.previousSchool?.name || '',
        studentDetails.transport?.mode || '',
        studentDetails.financial?.bankDetails?.bankName || '',
        studentDetails.financial?.bankDetails?.accountNumber || '',
        studentDetails.financial?.bankDetails?.ifscCode || ''
      ];
    } else if (role === 'teacher') {
      const teacherDetails = user.teacherDetails || {};
      const qualification = teacherDetails.qualification || {};
      const experience = teacherDetails.experience || {};
      const subjects = teacherDetails.subjects || [];

      return [
        ...baseData,
        teacherDetails.employeeId || '',
        teacherDetails.designation || '',
        teacherDetails.department || '',
        teacherDetails.joiningDate ? new Date(teacherDetails.joiningDate).toISOString().split('T')[0] : '',
        qualification.highest || '',
        experience.total || 0,
        subjects.map(s => s.subjectName || s).join(';'),
        teacherDetails.salary?.basic || '',
        teacherDetails.bankDetails?.bankName || '',
        teacherDetails.bankDetails?.accountNumber || '',
        teacherDetails.bankDetails?.ifscCode || ''
      ];
    } else if (role === 'admin') {
      const adminDetails = user.adminDetails || {};
      const qualification = adminDetails.qualification || {};
      const experience = adminDetails.experience || {};

      return [
        ...baseData,
        adminDetails.adminId || '',
        adminDetails.adminType || '',
        adminDetails.designation || '',
        adminDetails.department || '',
        adminDetails.joiningDate ? new Date(adminDetails.joiningDate).toISOString().split('T')[0] : '',
        Object.keys(adminDetails.permissions || {}).filter(k => adminDetails.permissions[k]).join(';'),
        adminDetails.accessLevel || '',
        qualification.highest || '',
        experience.total || 0,
        adminDetails.salary?.basic || '',
        adminDetails.bankDetails?.bankName || '',
        adminDetails.bankDetails?.accountNumber || '',
        adminDetails.bankDetails?.ifscCode || ''
      ];
    }

    return baseData;
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
}

function generateTemplateForRole(role) {
  const headers = getHeadersForRole(role);
  const sampleData = getSampleDataForRole(role);

  const csvContent = [
    headers.join(','),
    sampleData.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
  ].join('\n');

  return csvContent;
}

function getSampleDataForRole(role) {
  const baseSample = [
    '', // User ID (auto-generated)
    'John', 'Kumar', 'Doe', 'john.doe@school.edu', '9876543210',
    '2010-05-15', 'male', '123 Main Street', 'Bangalore', 'Karnataka', '560001',
    'active', '', '' // Status, Created Date, Last Modified
  ];

  if (role === 'student') {
    return [
      ...baseSample,
      '', // Student ID (auto-generated)
      'ADM001', '25', '8', 'A', '2024-25',
      'Raj Kumar', 'Priya Kumar', 'Raj Kumar', '9876543210', '9876543211',
      '123456789012', 'Hindu', 'General', 'General', 'Not Applicable', 'No',
      'Previous School', 'School Bus', 'State Bank', '1234567890', 'SBIN0012345'
    ];
  } else if (role === 'teacher') {
    return [
      ...baseSample,
      'TEA001', 'Senior Teacher', 'Mathematics', '2020-06-15',
      'M.Sc Mathematics', '5', 'Mathematics;Physics', '50000',
      'State Bank', '1234567890', 'SBIN0012345'
    ];
  } else if (role === 'admin') {
    return [
      ...baseSample,
      'ADM001', 'Principal', 'Administration', '2018-06-01',
      'userManagement;academicManagement', 'Full', 'M.A Education', '10',
      '75000', 'State Bank', '1234567890', 'SBIN0012345'
    ];
  }

  return baseSample;
}

function validateUserRow(row, rowNumber) {
  const errors = [];
  const role = row['Role*'] || row['Role'] || 'student';

  // Common validations
  if (!row['First Name*'] && !row['First Name']) {
    errors.push({ row: rowNumber, error: 'First Name is required', data: row });
  }
  if (!row['Last Name*'] && !row['Last Name']) {
    errors.push({ row: rowNumber, error: 'Last Name is required', data: row });
  }
  if (!row['Email*'] && !row['Email']) {
    errors.push({ row: rowNumber, error: 'Email is required', data: row });
  }
  if (!row['Phone*'] && !row['Phone']) {
    errors.push({ row: rowNumber, error: 'Phone is required', data: row });
  }
  if (!row['Date of Birth* (YYYY-MM-DD)'] && !row['Date of Birth']) {
    errors.push({ row: rowNumber, error: 'Date of Birth is required', data: row });
  }
  if (!row['Gender*'] && !row['Gender']) {
    errors.push({ row: rowNumber, error: 'Gender is required', data: row });
  }

  // Role-specific validations
  if (role === 'student') {
    if (!row['Class*'] && !row['Class']) {
      errors.push({ row: rowNumber, error: 'Class is required for students', data: row });
    }
    if (!row['Section*'] && !row['Section']) {
      errors.push({ row: rowNumber, error: 'Section is required for students', data: row });
    }
    if (!row['Father Name*'] && !row['Father Name']) {
      errors.push({ row: rowNumber, error: 'Father Name is required for students', data: row });
    }
    if (!row['Mother Name*'] && !row['Mother Name']) {
      errors.push({ row: rowNumber, error: 'Mother Name is required for students', data: row });
    }
  } else if (role === 'teacher') {
    if (!row['Designation*'] && !row['Designation']) {
      errors.push({ row: rowNumber, error: 'Designation is required for teachers', data: row });
    }
    if (!row['Department*'] && !row['Department']) {
      errors.push({ row: rowNumber, error: 'Department is required for teachers', data: row });
    }
    if (!row['Qualification*'] && !row['Qualification']) {
      errors.push({ row: rowNumber, error: 'Qualification is required for teachers', data: row });
    }
  } else if (role === 'admin') {
    if (!row['Admin Level*'] && !row['Admin Level']) {
      errors.push({ row: rowNumber, error: 'Admin Level is required for admins', data: row });
    }
    if (!row['Designation*'] && !row['Designation']) {
      errors.push({ row: rowNumber, error: 'Designation is required for admins', data: row });
    }
    if (!row['Department*'] && !row['Department']) {
      errors.push({ row: rowNumber, error: 'Department is required for admins', data: row });
    }
  }

  return errors;
}

// This function is unchanged from the previous correct version.
async function createUserFromRow(row, schoolId, userId, schoolCode) {
  const role = row['Role*'] || row['Role'] || 'student';
  const firstName = row['First Name*'] || row['First Name'];
  const lastName = row['Last Name*'] || row['Last Name'];
  const middleName = row['Middle Name'] || '';
  const email = row['Email*'] || row['Email'];
  const phone = row['Phone*'] || row['Phone'];

  // --- 1. Fix Date of Birth ---
  const dateOfBirthString = row['Date of Birth* (YYYY-MM-DD)'] || row['Date of Birth'];
  let finalDateOfBirth;
  if (dateOfBirthString) {
    const parts = dateOfBirthString.split('/');
    if (parts.length === 3) {
      // Input is DD/MM/YYYY, convert to YYYY-MM-DD
      finalDateOfBirth = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
    } else {
      // Assume YYYY-MM-DD or other valid format
      finalDateOfBirth = new Date(dateOfBirthString);
    }
  }

  // Throw error if date is invalid after parsing
  if (!finalDateOfBirth || isNaN(finalDateOfBirth.getTime())) {
    throw new Error(`Invalid Date of Birth format for email ${email}. Expected YYYY-MM-DD or DD/MM/YYYY.`);
  }

  // --- 2. Generate Password ---
  let temporaryPassword;
  if (role === 'student' && dateOfBirthString) {
    temporaryPassword = generateStudentPasswordFromDOB(dateOfBirthString);
  } else {
    const { generateTempPassword } = require('../utils/passwordGenerator');
    temporaryPassword = generateTempPassword(firstName, userId);
  }

  // --- 3. Fix Enum Values ---
  const gender = (row['Gender*'] || row['Gender'] || 'male').toLowerCase();

  let rte = row['Is RTE Candidate*'] || row['Is RTE Candidate'] || 'No';
  if (rte !== 'Yes' && rte !== 'No') {
    rte = 'No';
  }

  let disability = row['Disability'] || 'Not Applicable';
  if (disability.startsWith('SampleData')) {
    disability = 'Not Applicable';
  }

  let category = row['Category'] || 'General';
  if (category.startsWith('SampleData')) {
    category = 'General';
  }

  // --- 4. Fix Pincode ---
  let pincode = row['Pin Code'] || '000000';
  if (!/^\d{6}$/.test(pincode)) { // Check if it's 6 digits
    pincode = '000000'; // Default if invalid (e.g., "SampleData1")
  }

  // --- 5. Build userData object to match Mongoose Schema ---
  const userData = {
    userId,
    name: {
      firstName,
      middleName,
      lastName,
      displayName: `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim()
    },
    email,
    role,
    schoolId,
    schoolCode: schoolCode,
    password: temporaryPassword, // Assumes pre-save hook hashes it
    temporaryPassword,
    passwordChangeRequired: true,
    status: row['Status'] || 'active',

    contact: {
      primaryPhone: phone
    },

    address: {
      permanent: {
        street: row['Address'] || 'Not Provided',
        city: row['City'] || 'Not Provided',
        state: row['State'] || 'Not Provided',
        pincode: pincode,
        country: 'India'
      }
    },

    schoolAccess: {
      joinedDate: new Date(),
      assignedBy: schoolId
    },

    district: row['District'] || row['Current District*'] || ''
  };

  // Add role-specific details
  if (role === 'student') {
    userData.studentDetails = {
      studentId: userId,
      academic: {
        class: row['Class*'] || row['Class'] || '',
        section: row['Section*'] || row['Section'] || '',
        academicYear: row['Academic Year'] || '2024-25',
        admissionNumber: row['Admission Number'] || '',
        rollNumber: row['Roll Number'] || ''
      },
      personal: {
        dateOfBirth: finalDateOfBirth,
        gender: gender,
        aadhaarNumber: row['Aadhaar Number'] || '',
        religion: row['Religion'] || '',
        caste: row['Caste'] || '',
        category: category,
        disability: disability,
        isRTECandidate: rte
      },
      family: {
        father: {
          name: row['Father Name*'] || row['Father Name'] || '',
          phone: row['Father Phone'] || ''
        },
        mother: {
          name: row['Mother Name*'] || row['Mother Name'] || '',
          phone: row['Mother Phone'] || ''
        },
        guardian: {
          name: row['Guardian Name'] || ''
        }
      }
    };
  } else if (role === 'teacher') {
    userData.teacherDetails = {
      employeeId: row['Employee ID'] || '',
      designation: row['Designation*'] || row['Designation'] || '',
      department: row['Department*'] || row['Department'] || '',
      joiningDate: row['Joining Date (YYYY-MM-DD)'] ? new Date(row['Joining Date (YYYY-MM-DD)']) : undefined,
      qualification: {
        highest: row['Qualification*'] || row['Qualification'] || ''
      },
      experience: {
        total: parseInt(row['Experience'] || '0')
      },
      subjects: (row['Subjects'] || '').split(';').filter(s => s.trim()).map(subject => ({
        subjectCode: subject.trim(),
        subjectName: subject.trim()
      }))
    };
  } else if (role === 'admin') {
    userData.adminDetails = {
      adminType: row['Admin Level*'] || row['Admin Level'] || '',
      designation: row['Designation*'] || row['Designation'] || '',
      department: row['Department*'] || row['Department'] || '',
      joiningDate: row['Joining Date (YYYY-MM-DD)'] ? new Date(row['Joining Date (YYYY-MM-DD)']) : undefined,
      permissions: {
        userManagement: (row['Permissions'] || '').includes('userManagement'),
        academicManagement: (row['Permissions'] || '').includes('academicManagement'),
        feeManagement: (row['Permissions'] || '').includes('feeManagement'),
        reportGeneration: (row['Permissions'] || '').includes('reportGeneration'),
        systemSettings: (row['Permissions'] || '').includes('systemSettings'),
        schoolSettings: (row['Permissions'] || '').includes('schoolSettings'),
        dataExport: (row['Permissions'] || '').includes('dataExport'),
        auditLogs: (row['Permissions'] || '').includes('auditLogs')
      }
    };
  }

  return userData;
}

// This helper function is now ONLY used by other parts of the controller (like template generation)
// and is NOT called inside the import loop, which fixes the race condition.
async function generateUserId(schoolCode, role) {
  const UserGenerator = require('../utils/userGenerator');
  return await UserGenerator.generateUserId(schoolCode, role);
}

module.exports = {
  exportUsers: exports.exportUsers,
  importUsers: exports.importUsers,
  generateTemplate: exports.generateTemplate
};