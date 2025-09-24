const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const School = require('../models/School');
const User = require('../models/User');
const { generateSequentialUserId } = require('./userController');
const { generateRandomPassword, generateStudentPasswordFromDOB } = require('../utils/passwordGenerator');

// Get all users for a school with standardized format
exports.getAllUsers = async (req, res) => {
  try {
    const { schoolCode } = req.params;
    
    console.log(`🔍 Fetching all users for school: ${schoolCode}`);
    
    // Validate school exists
    const school = await School.findOne({ code: schoolCode.toUpperCase() });
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Get users from school-specific database
    const SchoolDatabaseManager = require('../utils/databaseManager');
    const connection = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    
    if (!connection) {
      return res.status(500).json({
        success: false,
        message: 'Could not connect to school database'
      });
    }

    const db = connection.db;
    const collections = ['admins', 'teachers', 'students', 'parents'];
    let allUsers = [];

    // Fetch users from all role collections
    for (const collection of collections) {
      try {
        const users = await db.collection(collection).find({ isActive: { $ne: false } }).toArray();
        
        const processedUsers = users.map(user => ({
          _id: user._id,
          userId: user.userId,
          schoolCode: user.schoolCode || schoolCode,
          name: {
            firstName: user.name?.firstName || user.firstName || 'Unknown',
            middleName: user.name?.middleName || user.middleName || '',
            lastName: user.name?.lastName || user.lastName || 'User',
            displayName: user.name?.displayName || 
                        `${user.name?.firstName || user.firstName || ''} ${user.name?.lastName || user.lastName || ''}`.trim()
          },
          email: user.email || 'no-email@example.com',
          role: user.role || collection.slice(0, -1), // Remove 's' from collection name
          contact: {
            primaryPhone: user.contact?.primaryPhone || user.phone || '0000000000',
            secondaryPhone: user.contact?.secondaryPhone || '',
            whatsappNumber: user.contact?.whatsappNumber || '',
            emergencyContact: user.contact?.emergencyContact || undefined
          },
          address: {
            permanent: {
              street: user.address?.permanent?.street || user.address?.street || '',
              area: user.address?.permanent?.area || user.address?.area || '',
              city: user.address?.permanent?.city || user.address?.city || '',
              state: user.address?.permanent?.state || user.address?.state || '',
              country: user.address?.permanent?.country || user.address?.country || 'India',
              pincode: user.address?.permanent?.pincode || user.address?.pincode || '',
              landmark: user.address?.permanent?.landmark || user.address?.landmark || ''
            },
            current: user.address?.current || undefined,
            sameAsPermanent: user.address?.sameAsPermanent !== false
          },
          identity: user.identity || undefined,
          isActive: user.isActive !== false,
          passwordChangeRequired: user.passwordChangeRequired || false,
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: user.updatedAt || user.createdAt || new Date().toISOString(),
          schoolAccess: user.schoolAccess || undefined,
          
          // Role-specific details
          ...(user.role === 'student' && user.studentDetails ? { studentDetails: user.studentDetails } : {}),
          ...(user.role === 'teacher' && user.teacherDetails ? { teacherDetails: user.teacherDetails } : {}),
          ...(user.role === 'admin' && user.adminDetails ? { adminDetails: user.adminDetails } : {})
        }));

        allUsers.push(...processedUsers);
      } catch (collectionError) {
        console.log(`Collection ${collection} not found or empty`);
      }
    }

    console.log(`✅ Found ${allUsers.length} users for school ${schoolCode}`);

    res.json({
      success: true,
      data: allUsers,
      total: allUsers.length,
      breakdown: {
        students: allUsers.filter(u => u.role === 'student').length,
        teachers: allUsers.filter(u => u.role === 'teacher').length,
        admins: allUsers.filter(u => u.role === 'admin').length,
        parents: allUsers.filter(u => u.role === 'parent').length
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get user by ID with full details
exports.getUserById = async (req, res) => {
  try {
    const { schoolCode, userId } = req.params;
    
    console.log(`🔍 Fetching user ${userId} for school: ${schoolCode}`);
    
    // Get user from school-specific database
    const SchoolDatabaseManager = require('../utils/databaseManager');
    const connection = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    
    if (!connection) {
      return res.status(500).json({
        success: false,
        message: 'Could not connect to school database'
      });
    }

    const db = connection.db;
    const collections = ['admins', 'teachers', 'students', 'parents'];
    let user = null;

    // Search for user in all collections
    for (const collection of collections) {
      try {
        const foundUser = await db.collection(collection).findOne({ 
          $or: [
            { userId: userId },
            { _id: ObjectId.isValid(userId) ? new ObjectId(userId) : null }
          ]
        });
        
        if (foundUser) {
          user = foundUser;
          break;
        }
      } catch (collectionError) {
        console.log(`Error searching in collection ${collection}:`, collectionError.message);
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return user with standardized format (excluding password)
    const { password, temporaryPassword, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Create new user with standardized data structure
exports.createUser = async (req, res) => {
  try {
    const { schoolCode } = req.params;
    const userData = req.body;
    
    console.log(`🔥 Creating user for school: ${schoolCode}`, userData);
    
    // Validate school exists
    const school = await School.findOne({ code: schoolCode.toUpperCase() });
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Validate required fields
    if (!userData.firstName || !userData.lastName || !userData.email || !userData.role) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and role are required'
      });
    }

    // Validate role
    if (!['admin', 'teacher', 'student', 'parent'].includes(userData.role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Check if email already exists
    const SchoolDatabaseManager = require('../utils/databaseManager');
    const connection = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    const db = connection.db;
    
    const collections = ['admins', 'teachers', 'students', 'parents'];
    for (const collection of collections) {
      try {
        const existingUser = await db.collection(collection).findOne({ email: userData.email });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already exists in this school'
          });
        }
      } catch (error) {
        // Collection might not exist yet, continue
      }
    }

    // Generate user ID
    const userId = await generateSequentialUserId(schoolCode, userData.role);
    
    // Generate password
    let tempPassword;
    if (userData.useGeneratedPassword) {
      if (userData.role === 'student' && userData.dateOfBirth) {
        tempPassword = generateStudentPasswordFromDOB(userData.dateOfBirth);
      } else {
        tempPassword = generateRandomPassword(8);
      }
    } else if (userData.customPassword) {
      tempPassword = userData.customPassword;
    } else {
      tempPassword = generateRandomPassword(8);
    }

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Structure user data according to our standardized format
    const newUser = {
      userId,
      schoolCode: schoolCode.toUpperCase(),
      schoolId: school._id,
      
      // Name structure
      name: {
        firstName: userData.firstName.trim(),
        middleName: userData.middleName?.trim() || '',
        lastName: userData.lastName.trim(),
        displayName: `${userData.firstName.trim()} ${userData.lastName.trim()}`.trim()
      },
      
      // Basic information
      email: userData.email.trim().toLowerCase(),
      password: hashedPassword,
      temporaryPassword: tempPassword,
      passwordChangeRequired: true,
      role: userData.role,
      
      // Contact information
      contact: {
        primaryPhone: userData.primaryPhone?.trim() || '0000000000',
        secondaryPhone: userData.secondaryPhone?.trim() || '',
        whatsappNumber: userData.whatsappNumber?.trim() || '',
        emergencyContact: userData.emergencyContactName ? {
          name: userData.emergencyContactName.trim(),
          relationship: userData.emergencyContactRelation?.trim() || '',
          phone: userData.emergencyContactPhone?.trim() || ''
        } : undefined
      },
      
      // Address information
      address: {
        permanent: {
          street: userData.permanentStreet?.trim() || '',
          area: userData.permanentArea?.trim() || '',
          city: userData.permanentCity?.trim() || '',
          state: userData.permanentState?.trim() || '',
          country: userData.permanentCountry || 'India',
          pincode: userData.permanentPincode?.trim() || '',
          landmark: userData.permanentLandmark?.trim() || ''
        },
        current: userData.sameAsPermanent ? undefined : {
          street: userData.currentStreet?.trim() || '',
          area: userData.currentArea?.trim() || '',
          city: userData.currentCity?.trim() || '',
          state: userData.currentState?.trim() || '',
          country: userData.currentCountry || 'India',
          pincode: userData.currentPincode?.trim() || '',
          landmark: userData.currentLandmark?.trim() || ''
        },
        sameAsPermanent: userData.sameAsPermanent !== false
      },
      
      // Identity information
      identity: {
        aadharNumber: userData.aadharNumber?.trim() || '',
        panNumber: userData.panNumber?.trim() || ''
      },
      
      // System fields
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      schoolAccess: {
        joinedDate: new Date(),
        assignedBy: req.user?._id,
        status: 'active',
        accessLevel: 'full'
      },
      auditTrail: {
        createdBy: req.user?._id,
        createdAt: new Date()
      }
    };

    // Add role-specific details
    if (userData.role === 'student') {
      newUser.studentDetails = {
        currentClass: userData.currentClass?.trim() || '',
        currentSection: userData.currentSection?.trim() || '',
        rollNumber: userData.rollNumber?.trim() || '',
        admissionNumber: userData.admissionNumber?.trim() || '',
        admissionDate: userData.admissionDate || '',
        dateOfBirth: userData.dateOfBirth || '',
        gender: userData.gender || 'male',
        bloodGroup: userData.bloodGroup?.trim() || '',
        nationality: userData.nationality || 'Indian',
        religion: userData.religion?.trim() || '',
        caste: userData.caste?.trim() || '',
        category: userData.category?.trim() || '',
        
        // Family information
        fatherName: userData.fatherName?.trim() || '',
        fatherPhone: userData.fatherPhone?.trim() || '',
        fatherEmail: userData.fatherEmail?.trim() || '',
        fatherOccupation: userData.fatherOccupation?.trim() || '',
        fatherAnnualIncome: userData.fatherAnnualIncome || 0,
        
        motherName: userData.motherName?.trim() || '',
        motherPhone: userData.motherPhone?.trim() || '',
        motherEmail: userData.motherEmail?.trim() || '',
        motherOccupation: userData.motherOccupation?.trim() || '',
        motherAnnualIncome: userData.motherAnnualIncome || 0,
        
        // Guardian information
        guardianName: userData.guardianName?.trim() || '',
        guardianRelationship: userData.guardianRelationship?.trim() || '',
        guardianPhone: userData.guardianPhone?.trim() || '',
        guardianEmail: userData.guardianEmail?.trim() || '',
        
        // Previous school
        previousSchoolName: userData.previousSchoolName?.trim() || '',
        previousBoard: userData.previousBoard?.trim() || '',
        lastClass: userData.lastClass?.trim() || '',
        tcNumber: userData.tcNumber?.trim() || '',
        
        // Transportation
        transportMode: userData.transportMode?.trim() || '',
        busRoute: userData.busRoute?.trim() || '',
        pickupPoint: userData.pickupPoint?.trim() || '',
        
        // Financial information
        feeCategory: userData.feeCategory?.trim() || '',
        concessionType: userData.concessionType?.trim() || '',
        concessionPercentage: userData.concessionPercentage || 0,
        
        // Banking information
        bankName: userData.bankName?.trim() || '',
        bankAccountNo: userData.bankAccountNo?.trim() || '',
        bankIFSC: userData.bankIFSC?.trim() || '',
        
        // Medical information
        medicalConditions: userData.medicalConditions?.trim() || '',
        allergies: userData.allergies?.trim() || '',
        specialNeeds: userData.specialNeeds?.trim() || ''
      };
    } else if (userData.role === 'teacher') {
      newUser.teacherDetails = {
        employeeId: userData.employeeId?.trim() || userId,
        subjects: Array.isArray(userData.subjects) ? userData.subjects : [],
        qualification: userData.qualification?.trim() || '',
        experience: userData.experience || 0,
        joiningDate: userData.joiningDate || '',
        specialization: userData.specialization?.trim() || '',
        previousExperience: userData.previousExperience?.trim() || '',
        dateOfBirth: userData.dateOfBirth || '',
        gender: userData.gender || 'male',
        bloodGroup: userData.bloodGroup?.trim() || '',
        nationality: userData.nationality || 'Indian',
        religion: userData.religion?.trim() || '',
        bankName: userData.bankName?.trim() || '',
        bankAccountNo: userData.bankAccountNo?.trim() || '',
        bankIFSC: userData.bankIFSC?.trim() || ''
      };
    } else if (userData.role === 'admin') {
      newUser.adminDetails = {
        employeeId: userData.employeeId?.trim() || userId,
        designation: userData.designation?.trim() || '',
        qualification: userData.qualification?.trim() || '',
        experience: userData.experience || 0,
        joiningDate: userData.joiningDate || '',
        previousExperience: userData.previousExperience?.trim() || '',
        dateOfBirth: userData.dateOfBirth || '',
        gender: userData.gender || 'male',
        bloodGroup: userData.bloodGroup?.trim() || '',
        nationality: userData.nationality || 'Indian',
        bankName: userData.bankName?.trim() || '',
        bankAccountNo: userData.bankAccountNo?.trim() || '',
        bankIFSC: userData.bankIFSC?.trim() || ''
      };
    }

    // Insert user into appropriate collection
    const collectionName = userData.role === 'admin' ? 'admins' :
                          userData.role === 'teacher' ? 'teachers' :
                          userData.role === 'student' ? 'students' : 'parents';
    
    const result = await db.collection(collectionName).insertOne(newUser);
    
    console.log(`✅ User created successfully: ${userId}`);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        userId: newUser.userId,
        name: newUser.name.displayName,
        email: newUser.email,
        role: newUser.role,
        temporaryPassword: tempPassword
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// Update user with standardized data structure
exports.updateUser = async (req, res) => {
  try {
    const { schoolCode, userId } = req.params;
    const updateData = req.body;
    
    console.log(`🔄 Updating user ${userId} for school: ${schoolCode}`);
    
    // Get user from school-specific database
    const SchoolDatabaseManager = require('../utils/databaseManager');
    const connection = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    
    if (!connection) {
      return res.status(500).json({
        success: false,
        message: 'Could not connect to school database'
      });
    }

    const db = connection.db;
    const collections = ['admins', 'teachers', 'students', 'parents'];
    let user = null;
    let collectionName = null;

    // Find user in collections
    for (const collection of collections) {
      try {
        const foundUser = await db.collection(collection).findOne({ 
          $or: [
            { userId: userId },
            { _id: ObjectId.isValid(userId) ? new ObjectId(userId) : null }
          ]
        });
        
        if (foundUser) {
          user = foundUser;
          collectionName = collection;
          break;
        }
      } catch (collectionError) {
        console.log(`Error searching in collection ${collection}:`, collectionError.message);
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare update object (only update provided fields)
    const updateFields = {
      updatedAt: new Date()
    };

    // Update basic information
    if (updateData.firstName || updateData.lastName) {
      updateFields.name = {
        ...user.name,
        ...(updateData.firstName && { firstName: updateData.firstName.trim() }),
        ...(updateData.lastName && { lastName: updateData.lastName.trim() }),
        ...(updateData.middleName !== undefined && { middleName: updateData.middleName?.trim() || '' })
      };
      updateFields.name.displayName = `${updateFields.name.firstName} ${updateFields.name.lastName}`.trim();
    }

    if (updateData.email) {
      updateFields.email = updateData.email.trim().toLowerCase();
    }

    // Update contact information
    if (updateData.primaryPhone || updateData.secondaryPhone || updateData.whatsappNumber) {
      updateFields.contact = {
        ...user.contact,
        ...(updateData.primaryPhone && { primaryPhone: updateData.primaryPhone.trim() }),
        ...(updateData.secondaryPhone !== undefined && { secondaryPhone: updateData.secondaryPhone?.trim() || '' }),
        ...(updateData.whatsappNumber !== undefined && { whatsappNumber: updateData.whatsappNumber?.trim() || '' })
      };
    }

    // Update address information
    if (updateData.permanentStreet || updateData.permanentCity || updateData.permanentState) {
      updateFields.address = {
        ...user.address,
        permanent: {
          ...user.address?.permanent,
          ...(updateData.permanentStreet !== undefined && { street: updateData.permanentStreet?.trim() || '' }),
          ...(updateData.permanentArea !== undefined && { area: updateData.permanentArea?.trim() || '' }),
          ...(updateData.permanentCity !== undefined && { city: updateData.permanentCity?.trim() || '' }),
          ...(updateData.permanentState !== undefined && { state: updateData.permanentState?.trim() || '' }),
          ...(updateData.permanentCountry !== undefined && { country: updateData.permanentCountry || 'India' }),
          ...(updateData.permanentPincode !== undefined && { pincode: updateData.permanentPincode?.trim() || '' }),
          ...(updateData.permanentLandmark !== undefined && { landmark: updateData.permanentLandmark?.trim() || '' })
        }
      };
    }

    // Update role-specific details
    if (user.role === 'student' && updateData.currentClass) {
      updateFields.studentDetails = {
        ...user.studentDetails,
        ...(updateData.currentClass && { currentClass: updateData.currentClass.trim() }),
        ...(updateData.currentSection && { currentSection: updateData.currentSection.trim() }),
        // Add other student-specific updates as needed
      };
    } else if (user.role === 'teacher' && (updateData.subjects || updateData.qualification)) {
      updateFields.teacherDetails = {
        ...user.teacherDetails,
        ...(updateData.subjects && { subjects: Array.isArray(updateData.subjects) ? updateData.subjects : [] }),
        ...(updateData.qualification && { qualification: updateData.qualification.trim() }),
        // Add other teacher-specific updates as needed
      };
    } else if (user.role === 'admin' && (updateData.designation || updateData.qualification)) {
      updateFields.adminDetails = {
        ...user.adminDetails,
        ...(updateData.designation && { designation: updateData.designation.trim() }),
        ...(updateData.qualification && { qualification: updateData.qualification.trim() }),
        // Add other admin-specific updates as needed
      };
    }

    // Perform update
    const result = await db.collection(collectionName).updateOne(
      { _id: user._id },
      { $set: updateFields }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes were made'
      });
    }

    console.log(`✅ User updated successfully: ${userId}`);
    
    res.json({
      success: true,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { schoolCode, userId } = req.params;
    
    console.log(`🗑️ Deleting user ${userId} for school: ${schoolCode}`);
    
    // Get user from school-specific database
    const SchoolDatabaseManager = require('../utils/databaseManager');
    const connection = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    
    if (!connection) {
      return res.status(500).json({
        success: false,
        message: 'Could not connect to school database'
      });
    }

    const db = connection.db;
    const collections = ['admins', 'teachers', 'students', 'parents'];
    let user = null;
    let collectionName = null;

    // Find user in collections
    for (const collection of collections) {
      try {
        const foundUser = await db.collection(collection).findOne({ 
          $or: [
            { userId: userId },
            { _id: ObjectId.isValid(userId) ? new ObjectId(userId) : null }
          ]
        });
        
        if (foundUser) {
          user = foundUser;
          collectionName = collection;
          break;
        }
      } catch (collectionError) {
        console.log(`Error searching in collection ${collection}:`, collectionError.message);
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user
    const result = await db.collection(collectionName).deleteOne({ _id: user._id });
    
    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete user'
      });
    }

    console.log(`✅ User deleted successfully: ${userId}`);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// Reset user password (admin/teacher only)
exports.resetPassword = async (req, res) => {
  try {
    const { schoolCode, userId } = req.params;
    
    console.log(`🔑 Resetting password for user ${userId} in school: ${schoolCode}`);
    
    // Get user from school-specific database
    const SchoolDatabaseManager = require('../utils/databaseManager');
    const connection = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    
    if (!connection) {
      return res.status(500).json({
        success: false,
        message: 'Could not connect to school database'
      });
    }

    const db = connection.db;
    const collections = ['admins', 'teachers', 'students', 'parents'];
    let user = null;
    let collectionName = null;

    // Find user in collections
    for (const collection of collections) {
      try {
        const foundUser = await db.collection(collection).findOne({ 
          $or: [
            { userId: userId },
            { _id: ObjectId.isValid(userId) ? new ObjectId(userId) : null }
          ]
        });
        
        if (foundUser) {
          user = foundUser;
          collectionName = collection;
          break;
        }
      } catch (collectionError) {
        console.log(`Error searching in collection ${collection}:`, collectionError.message);
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow password reset for students
    if (user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Password reset is not allowed for students'
      });
    }

    // Generate new password
    const newPassword = generateRandomPassword(8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    const result = await db.collection(collectionName).updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          temporaryPassword: newPassword,
          passwordChangeRequired: true,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to reset password'
      });
    }

    console.log(`✅ Password reset successfully for user: ${userId}`);
    
    res.json({
      success: true,
      message: 'Password reset successfully',
      newPassword: newPassword
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};
