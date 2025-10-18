// --- Imports ---
const User = require('../models/User');
const School = require('../models/School');
const { generateStudentPasswordFromDOB, generateRandomPassword } = require('../utils/passwordGenerator');
const csv = require('csv-parse');
const fs = require('fs');
const { promisify } = require('util');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const SchoolDatabaseManager = require('../utils/databaseManager');
const { generateSequentialUserId } = require('./userController');

const parseCsv = promisify(csv.parse);

// --- Export Function (Unchanged) ---
exports.exportUsers = async (req, res) => {
  try {
    const { schoolCode } = req.params;
    const { role, format = 'csv' } = req.query;
    const upperSchoolCode = schoolCode.toUpperCase();

    const school = await School.findOne({ code: upperSchoolCode });
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    const query = { schoolId: school._id };
    if (role && role !== 'all' && ['admin', 'teacher', 'student', 'parent'].includes(role)) {
      query.role = role;
    }

    // Fetch users from the central 'users' collection (institute_erp)
    const users = await User.find(query).lean();

    if (users.length === 0) {
      const headers = getStudentHeadersRobust();
      if (format === 'excel') return res.json({ success: true, data: [], headers: headers, filename: `${upperSchoolCode}_${role || 'all'}_users_empty.xlsx` });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${upperSchoolCode}_${role || 'all'}_users_empty.csv"`);
      return res.send(headers.join(','));
    }

    if (format === 'excel' || format === 'json') {
      return res.json({
        success: true, count: users.length, data: users,
        headers: getStudentHeadersRobust(),
        filename: `${upperSchoolCode}_${role || 'all'}_users_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'json'}`
      });
    }

    const csvContent = generateCSV(users, role);
    const filename = `${upperSchoolCode}_${role || 'all'}_users_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (error) {
    console.error(`Error exporting users for ${req.params.schoolCode}:`, error);
    res.status(500).json({ message: 'Error exporting users', error: error.message });
  }
};


// ==================================================================
// IMPORT FUNCTION (Final check on normalization and validation)
// ==================================================================
exports.importUsers = async (req, res) => {
  const { schoolCode } = req.params;
  const file = req.file;
  const creatingUserId = req.user?._id;
  const upperSchoolCode = schoolCode.toUpperCase();

  // --- Initial Checks ---
  if (!file) { return res.status(400).json({ message: 'No file uploaded' }); }
  if (!creatingUserId) {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return res.status(401).json({ message: 'Unauthorized: User performing import not identified.' });
  }

  // --- Validate School ---
  let school;
  try {
    school = await School.findOne({ code: upperSchoolCode });
    if (!school) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(404).json({ message: `School with code ${upperSchoolCode} not found` });
    }
  } catch (schoolError) {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    console.error(`Error finding school ${upperSchoolCode}:`, schoolError);
    return res.status(500).json({ message: 'Error verifying school.', error: schoolError.message });
  }

  // --- Get School DB Connection ---
  let connection;
  try {
    connection = await SchoolDatabaseManager.getSchoolConnection(upperSchoolCode);
    if (!connection) throw new Error('Database connection object invalid');
  } catch (connError) {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    console.error(`DB Connect Error for ${upperSchoolCode} in importUsers: ${connError.message}`);
    return res.status(500).json({ success: false, message: 'Could not connect to school database' });
  }
  const db = connection.db;
  const studentCollection = db.collection('students');

  // --- Parse CSV with Improved Normalization ---
  let csvData;
  try {
    console.log('Parsing CSV file...');
    const fileContent = fs.readFileSync(file.path);
    csvData = await parseCsv(fileContent, {
      columns: true, trim: true, skip_empty_lines: true, bom: true,
      on_record: (record) => {
        const normalizedRecord = {};
        for (const key in record) {
          let normalizedKey = key.toLowerCase().replace('*', '').split(' (')[0].replace(/\s+/g, '').trim();
          if (normalizedKey === 'phone') normalizedKey = 'primaryphone';
          else if (normalizedKey === 'class') normalizedKey = 'currentclass';
          else if (normalizedKey === 'section') normalizedKey = 'currentsection';
          else if (normalizedKey === 'dob' || normalizedKey === 'dateofbirth(dd/mm/yyyy)' || normalizedKey === 'birthdate') normalizedKey = 'dateofbirth';
          normalizedRecord[normalizedKey] = record[key];
        }
        return normalizedRecord;
      }
    });
    console.log(`CSV Parsed. Found ${csvData.length} data rows.`);
  } catch (parseError) {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    console.error('CSV Parsing Error:', parseError);
    return res.status(400).json({ message: 'Failed to parse CSV file. Ensure valid CSV format.', error: parseError.message });
  } finally {
    if (fs.existsSync(file.path)) {
      try { fs.unlinkSync(file.path); } catch (unlinkErr) { console.error(`Error deleting uploaded file ${file.path}: ${unlinkErr.message}`); }
    }
  }

  if (!csvData || csvData.length === 0) {
    return res.status(400).json({ message: 'CSV file is empty or contains no data rows.' });
  }

  // --- Process Rows Serially ---
  const results = { success: [], errors: [], total: csvData.length };
  const studentsToInsert = [];
  const processedEmails = new Set();

  let rowNumber = 1;
  console.log('Starting row processing...');
  for (const row of csvData) {
    rowNumber++;
    const userRole = 'student';
    const email = row['email']?.trim().toLowerCase();
    row.originalRowNumber = rowNumber;

    try {
      if (!email) throw new Error(`Email is required.`);
      if (processedEmails.has(email)) throw new Error(`Duplicate email '${email}' found within this CSV file.`);
      processedEmails.add(email);

      const validationErrors = validateStudentRowRobust(row, rowNumber);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.map(e => `${e.field}: ${e.error}`).join('; '));
      }

      const existingUser = await studentCollection.findOne({ email: email });
      if (existingUser) {
        throw new Error(`User already exists in database with this email: ${email}`);
      }

      const userId = await generateSequentialUserId(upperSchoolCode, userRole);

      // --- Create Student Data Object (Uses helper with DD-MM-YYYY fix) ---
      const studentData = await createStudentFromRowRobust(row, school._id, userId, upperSchoolCode, creatingUserId);

      studentsToInsert.push(studentData);
      results.success.push({ row: rowNumber, userId: studentData.userId, email: studentData.email, name: studentData.name.displayName });

    } catch (error) {
      console.error(`❌ Error processing row ${rowNumber}: ${error.message}`);
      results.errors.push({ row: rowNumber, error: error.message || 'Unknown error processing row.' });
    }
  } // --- End of Loop ---
  console.log(`Row processing finished. ${studentsToInsert.length} students prepared for insertion.`);

  // --- Perform Bulk Insert ---
  let insertedCount = 0;
  if (studentsToInsert.length > 0) {
    console.log(`Attempting to bulk insert ${studentsToInsert.length} processed students...`);
    try {
      const insertResult = await studentCollection.insertMany(studentsToInsert, { ordered: false });
      insertedCount = insertResult.insertedCount;
      console.log(`✅ Bulk insert attempted for ${upperSchoolCode}. Acknowledged inserts: ${insertedCount}.`);
    } catch (bulkError) {
      console.error(`Bulk insert operation error for ${upperSchoolCode}:`, bulkError);
      results.errors.push({
        row: 'N/A',
        error: `Bulk insert failed: ${bulkError.message || 'Unknown bulk error'}. Some valid rows might not have been inserted. Check server logs and DB indexes.`
      });
      insertedCount = bulkError.result?.nInserted || bulkError.insertedCount || 0;
      if (bulkError.writeErrors) {
        bulkError.writeErrors.forEach(err => {
          results.errors.push({ row: `N/A (Index ${err.index})`, error: `Insert Error: ${err.errmsg}` });
        });
      }
    }
  } else {
    console.warn(`⚠️ Bulk import: No valid students to insert for ${upperSchoolCode}. Check processing errors.`);
  }
  // --- END BULK INSERT ---

  // --- Final Response ---
  const finalSuccessCount = results.success.length;
  const finalErrorCount = results.errors.length;
  let finalMessage = `Import process completed. Total CSV rows (excluding header): ${results.total}.`;
  finalMessage += ` Rows successfully processed: ${finalSuccessCount}. Rows with errors: ${finalErrorCount}.`;
  if (studentsToInsert.length > 0) {
    finalMessage += ` Actual documents inserted: ${insertedCount}.`;
    if (insertedCount < studentsToInsert.length) {
      finalMessage += ` Some processed rows may have failed during bulk insert (check errors list).`;
    }
  } else if (finalSuccessCount === 0 && results.total > 0) {
    finalMessage += ` No students were inserted. Please review the errors list and ensure your CSV file headers match required fields (e.g., 'firstname', 'lastname', 'email', 'primaryphone', 'dateofbirth', 'gender', 'currentclass', 'currentsection', 'fathername', 'mothername'). Header variations like 'Phone' or 'Class' should be mapped automatically.`;
  }

  const overallSuccess = finalErrorCount === 0 && insertedCount === studentsToInsert.length && results.total > 0;

  res.status(overallSuccess ? 201 : 400).json({
    success: overallSuccess,
    message: finalMessage,
    results: {
      successData: results.success, // Use this data in frontend for download credentials
      errors: results.errors,
      totalRows: results.total,
      insertedCount: insertedCount
    }
  });
};
// ==================================================================
// END: CORRECTED IMPORT FUNCTION
// ==================================================================


// Generate template for import (Unchanged)
exports.generateTemplate = async (req, res) => {
  try {
    const { schoolCode } = req.params;
    const { role } = req.query;

    if (!role) { return res.status(400).json({ message: 'Role query parameter is required (e.g., ?role=student).' }); }

    const supportedRoles = ['student'];
    if (!supportedRoles.includes(role.toLowerCase())) {
      return res.status(400).json({ message: `Template generation currently only supported for role: student` });
    }

    const templateHeaders = getStudentHeadersRobust();
    const filename = `${schoolCode.toUpperCase()}_${role}_import_template_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(templateHeaders.join(','));

  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ message: 'Error generating template', error: error.message });
  }
};

// ==================================================================
// HELPER FUNCTIONS (Corrected Date Parsing)
// ==================================================================

// --- Define Robust Headers ---
function getStudentHeadersRobust() { /* ... (Remains the same) ... */
  return [
    'firstname', 'middlename', 'lastname', 'email', 'primaryphone',
    'dateofbirth', 'gender',
    'permanentstreet', 'permanentarea', 'permanentcity', 'permanentstate', 'permanentpincode', 'permanentcountry', 'permanentlandmark',
    'isactive',
    'admissionnumber', 'rollnumber', 'currentclass', 'currentsection', 'academicyear', 'admissiondate',
    'fathername', 'mothername', 'guardianname', 'fatherphone', 'motherphone', 'fatheremail', 'motheremail',
    'aadharnumber', 'religion', 'caste', 'category', 'disability', 'isrtcandidate',
    'previousschoolname', 'previousboard', 'lastclass', 'tcnumber',
    'transportmode', 'busroute', 'pickuppoint',
    'feecategory', 'concessiontype', 'concessionpercentage',
    'bankname', 'bankaccountno', 'bankifsc',
    'medicalconditions', 'allergies', 'specialneeds'
  ];
}

// --- CSV Generation (for Export) ---
function generateCSV(users, role) { /* ... (Remains the same) ... */
  if (role.toLowerCase() !== 'student') {
    console.warn("generateCSV currently only supports student role for export.");
    return getStudentHeadersRobust().join(','); // Return headers only
  }
  const headers = getStudentHeadersRobust();
  const rows = users.map(user => {
    const sd = user.studentDetails || {};
    const name = user.name || {};
    const contact = user.contact || {};
    const addressP = user.address?.permanent || {};
    const identity = user.identity || {};
    const rowData = {};
    headers.forEach(header => {
      let value = '';
      try {
        switch (header) {
          // Map ALL headers from getStudentHeadersRobust here
          case 'firstname': value = name.firstName; break;
          case 'middlename': value = name.middleName; break;
          case 'lastname': value = name.lastName; break;
          case 'email': value = user.email; break;
          case 'primaryphone': value = contact.primaryPhone; break;
          case 'dateofbirth': value = sd.dateOfBirth ? new Date(sd.dateOfBirth).toISOString().split('T')[0] : ''; break;
          case 'gender': value = sd.gender; break;
          case 'permanentstreet': value = addressP.street; break;
          case 'permanentarea': value = addressP.area; break;
          case 'permanentcity': value = addressP.city; break;
          case 'permanentstate': value = addressP.state; break;
          case 'permanentpincode': value = addressP.pincode; break;
          case 'permanentcountry': value = addressP.country; break;
          case 'permanentlandmark': value = addressP.landmark; break;
          case 'isactive': value = user.isActive === false ? 'false' : 'true'; break;
          case 'admissionnumber': value = sd.admissionNumber; break;
          case 'rollnumber': value = sd.rollNumber; break;
          case 'currentclass': value = sd.currentClass; break;
          case 'currentsection': value = sd.currentSection; break;
          case 'academicyear': value = sd.academicYear; break;
          case 'admissiondate': value = sd.admissionDate ? new Date(sd.admissionDate).toISOString().split('T')[0] : ''; break;
          case 'fathername': value = sd.fatherName; break;
          case 'mothername': value = sd.motherName; break;
          case 'guardianname': value = sd.guardianName; break;
          case 'fatherphone': value = sd.fatherPhone; break;
          case 'motherphone': value = sd.motherPhone; break;
          case 'fatheremail': value = sd.fatherEmail; break;
          case 'motheremail': value = sd.motherEmail; break;
          case 'aadharnumber': value = identity.aadharNumber; break;
          case 'religion': value = sd.religion; break;
          case 'caste': value = sd.caste; break;
          case 'category': value = sd.category; break;
          case 'disability': value = sd.disability; break;
          case 'isrtcandidate': value = sd.isRTECandidate; break;
          case 'previousschoolname': value = sd.previousSchoolName; break;
          case 'previousboard': value = sd.previousBoard; break;
          case 'lastclass': value = sd.lastClass; break;
          case 'tcnumber': value = sd.tcNumber; break;
          case 'transportmode': value = sd.transportMode; break;
          case 'busroute': value = sd.busRoute; break;
          case 'pickuppoint': value = sd.pickupPoint; break;
          case 'feecategory': value = sd.feeCategory; break;
          case 'concessiontype': value = sd.concessionType; break;
          case 'concessionpercentage': value = sd.concessionPercentage; break;
          case 'bankname': value = sd.bankName; break;
          case 'bankaccountno': value = sd.bankAccountNo; break;
          case 'bankifsc': value = sd.bankIFSC; break;
          case 'medicalconditions': value = sd.medicalConditions; break;
          case 'allergies': value = sd.allergies; break;
          case 'specialneeds': value = sd.specialNeeds; break;
          default: console.warn(`Unmapped header in generateCSV: ${header}`);
        }
      } catch (e) { console.warn(`Error accessing data for header ${header} in generateCSV`); }
      rowData[header] = value ?? '';
    });
    return headers.map(header => rowData[header]);
  });
  const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
  return csvContent;
}


// --- Robust Validation (Unchanged) ---
function validateStudentRowRobust(normalizedRow, rowNumber) { /* ... (Remains the same as previous version) ... */
  const errors = [];
  const requiredKeys = [
    'firstname', 'lastname', 'email', 'primaryphone',
    'dateofbirth', 'gender',
    'currentclass', 'currentsection',
    'fathername', 'mothername'
  ];

  requiredKeys.forEach(key => {
    if (!normalizedRow.hasOwnProperty(key) || normalizedRow[key] === undefined || normalizedRow[key] === null || String(normalizedRow[key]).trim() === '') {
      errors.push({ row: rowNumber, error: `is required`, field: key });
    }
  });

  if (normalizedRow['email'] && !/\S+@\S+\.\S+/.test(normalizedRow['email'])) {
    errors.push({ row: rowNumber, error: `Invalid format`, field: 'email' });
  }

  const pincode = normalizedRow['permanentpincode'];
  if (pincode && pincode.trim() !== '' && !/^\d{6}$/.test(pincode)) {
    errors.push({ row: rowNumber, error: `Invalid format (must be 6 digits if provided)`, field: 'permanentpincode' });
  }

  const gender = normalizedRow['gender']?.toLowerCase();
  if (gender && gender.trim() !== '' && !['male', 'female', 'other'].includes(gender)) {
    errors.push({ row: rowNumber, error: `Invalid value (must be 'male', 'female', or 'other' if provided)`, field: 'gender' });
  }

  const rte = normalizedRow['isrtcandidate']?.toLowerCase();
  if (rte && rte.trim() !== '' && !['yes', 'no'].includes(rte)) {
    errors.push({ row: rowNumber, error: `Invalid value (must be 'Yes' or 'No' if provided)`, field: 'isrtcandidate' });
  }

  return errors;
}


// ==================================================================
// START: *** CORRECTED HELPER TO CREATE STUDENT DATA OBJECT (Handles DD-MM-YYYY) ***
// ==================================================================
async function createStudentFromRowRobust(normalizedRow, schoolIdAsObjectId, userId, schoolCode, creatingUserIdAsObjectId) {

  const email = normalizedRow['email'];

  // --- 1. Parse Date of Birth (Handles DD-MM-YYYY) ---
  const dateOfBirthString = normalizedRow['dateofbirth'];
  let finalDateOfBirth = null;
  if (!dateOfBirthString) throw new Error(`Date of Birth is required.`);

  try {
    let parsedDate;
    // Try YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirthString)) {
      const [year, month, day] = dateOfBirthString.split('-').map(Number);
      if (!day || !month || !year || year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) throw new Error('Invalid YYYY-MM-DD components.');
      parsedDate = new Date(Date.UTC(year, month - 1, day));
    }
    // Try DD/MM/YYYY
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateOfBirthString)) {
      const [day, month, year] = dateOfBirthString.split('/').map(Number);
      if (!day || !month || !year || year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) throw new Error('Invalid DD/MM/YYYY components.');
      parsedDate = new Date(Date.UTC(year, month - 1, day));
    }
    // *** ADDED CHECK FOR DD-MM-YYYY ***
    else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateOfBirthString)) {
      const [day, month, year] = dateOfBirthString.split('-').map(Number);
      if (!day || !month || !year || year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) throw new Error('Invalid DD-MM-YYYY components.');
      parsedDate = new Date(Date.UTC(year, month - 1, day)); // Month is 0-indexed
    }
    // *** END ADDED CHECK ***
    else {
      throw new Error('Unrecognized date format.');
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) throw new Error('Resulting date is invalid.');
    finalDateOfBirth = parsedDate;

  } catch (e) {
    console.error(`Row ${normalizedRow.originalRowNumber || 'N/A'}: Invalid Date of Birth '${dateOfBirthString}'. ${e.message}`);
    // Make error message more user-friendly
    throw new Error(`Invalid Date of Birth format '${dateOfBirthString}'. Use YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY.`);
  }

  // --- 2. Generate and HASH Password ---
  let temporaryPassword;
  try { temporaryPassword = generateStudentPasswordFromDOB(dateOfBirthString); }
  catch (e) { temporaryPassword = generateRandomPassword(8); }
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  // --- 3. Fix Enum Values and Booleans ---
  let gender = normalizedRow['gender']?.toLowerCase();
  if (!['male', 'female', 'other'].includes(gender)) gender = 'other';
  const isActiveValue = normalizedRow['isactive']?.toLowerCase();
  const isActive = !(isActiveValue === 'false');
  const isRTECandidateValue = normalizedRow['isrtcandidate']?.toLowerCase();
  const isRTECandidate = isRTECandidateValue === 'yes' ? 'Yes' : 'No';

  // --- 4. Fix Pincode ---
  let pincode = normalizedRow['permanentpincode'] || '';
  if (pincode && !/^\d{6}$/.test(pincode)) pincode = '';

  // --- 5. Build userData object ---
  const firstName = normalizedRow['firstname'] || '';
  const lastName = normalizedRow['lastname'] || '';

  const newStudent = { /* ... (Rest of the object mapping remains the same as previous version) ... */
    _id: new ObjectId(),
    userId,
    schoolCode: schoolCode.toUpperCase(),
    schoolId: schoolIdAsObjectId,
    name: { firstName, middleName: normalizedRow['middlename'] || '', lastName, displayName: `${firstName} ${lastName}`.trim() },
    email: email,
    password: hashedPassword,
    temporaryPassword: temporaryPassword,
    passwordChangeRequired: true,
    role: 'student',
    contact: {
      primaryPhone: normalizedRow['primaryphone'] || '',
      secondaryPhone: normalizedRow['secondaryphone'] || '',
      whatsappNumber: normalizedRow['whatsappnumber'] || '',
    },
    address: {
      permanent: {
        street: normalizedRow['permanentstreet'] || '',
        area: normalizedRow['permanentarea'] || '',
        city: normalizedRow['permanentcity'] || '',
        state: normalizedRow['permanentstate'] || '',
        country: normalizedRow['permanentcountry'] || 'India',
        pincode: pincode,
        landmark: normalizedRow['permanentlandmark'] || ''
      },
      current: undefined,
      sameAsPermanent: true
    },
    identity: {
      aadharNumber: normalizedRow['aadharnumber'] || '',
      panNumber: normalizedRow['pannumber'] || ''
    },
    isActive: isActive,
    createdAt: new Date(),
    updatedAt: new Date(),
    schoolAccess: {
      joinedDate: new Date(),
      assignedBy: creatingUserIdAsObjectId,
      status: 'active',
      accessLevel: 'full'
    },
    auditTrail: {
      createdBy: creatingUserIdAsObjectId,
      createdAt: new Date()
    },
    studentDetails: {
      currentClass: normalizedRow['currentclass'] || '',
      currentSection: normalizedRow['currentsection'] || '',
      rollNumber: normalizedRow['rollnumber'] || '',
      admissionNumber: normalizedRow['admissionnumber'] || '',
      admissionDate: (() => {
        const admDateStr = normalizedRow['admissiondate'];
        if (!admDateStr) return new Date();
        try {
          // Add flexible parsing here too if needed (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY)
          let parsed;
          if (/^\d{4}-\d{2}-\d{2}$/.test(admDateStr)) {
            parsed = new Date(admDateStr);
          } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(admDateStr)) {
            const [day, month, year] = admDateStr.split('/').map(Number);
            parsed = new Date(Date.UTC(year, month - 1, day));
          } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(admDateStr)) {
            const [day, month, year] = admDateStr.split('-').map(Number);
            parsed = new Date(Date.UTC(year, month - 1, day));
          } else {
            parsed = new Date(admDateStr); // Fallback attempt
          }
          return isNaN(parsed.getTime()) ? new Date() : parsed;
        } catch { return new Date(); }
      })(),
      dateOfBirth: finalDateOfBirth,
      gender: gender,
      bloodGroup: normalizedRow['bloodgroup'] || '',
      nationality: normalizedRow['nationality'] || 'Indian',
      religion: normalizedRow['religion'] || '',
      caste: normalizedRow['caste'] || '',
      category: normalizedRow['category'] || '',
      fatherName: normalizedRow['fathername'] || '',
      fatherPhone: normalizedRow['fatherphone'] || '',
      fatherEmail: normalizedRow['fatheremail']?.toLowerCase() || '',
      motherName: normalizedRow['mothername'] || '',
      motherPhone: normalizedRow['motherphone'] || '',
      motherEmail: normalizedRow['motheremail']?.toLowerCase() || '',
      guardianName: normalizedRow['guardianname'] || '',
      previousSchoolName: normalizedRow['previousschoolname'] || '',
      previousBoard: normalizedRow['previousboard'] || '',
      lastClass: normalizedRow['lastclass'] || '',
      tcNumber: normalizedRow['tcnumber'] || '',
      transportMode: normalizedRow['transportmode'] || '',
      busRoute: normalizedRow['busroute'] || '',
      pickupPoint: normalizedRow['pickuppoint'] || '',
      feeCategory: normalizedRow['feecategory'] || '',
      concessionType: normalizedRow['concessiontype'] || '',
      concessionPercentage: parseInt(normalizedRow['concessionpercentage'] || '0') || 0,
      bankName: normalizedRow['bankname'] || '',
      bankAccountNo: normalizedRow['bankaccountno'] || '',
      bankIFSC: normalizedRow['bankifsc'] || '',
      medicalConditions: normalizedRow['medicalconditions'] || '',
      allergies: normalizedRow['allergies'] || '',
      specialNeeds: normalizedRow['specialneeds'] || '',
      disability: normalizedRow['disability'] || 'Not Applicable',
      isRTECandidate: isRTECandidate,
      academicYear: normalizedRow['academicyear'] || '',
    }
  };
  return newStudent;
}
// ==================================================================
// END: ROBUST HELPER FUNCTION
// ==================================================================


// Export necessary functions
module.exports = {
  exportUsers: exports.exportUsers,
  importUsers: exports.importUsers,
  generateTemplate: exports.generateTemplate
};