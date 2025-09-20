// Add these methods to testDetailsController.js

/**
 * Add test type to a specific class (superadmin access)
 */
exports.addTestTypeToClass = async (req, res) => {
  try {
    const { schoolId, className } = req.params;
    const { testType } = req.body;
    const academicYear = req.body.academicYear || '2024-25';

    // Verify superadmin role
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Superadmin access required.'
      });
    }

    // Validate test type
    if (!testType || !testType.name || !testType.code) {
      return res.status(400).json({
        success: false,
        message: 'Test type must have a name and code'
      });
    }

    // Find the school
    const School = require('../models/School');
    const school = await School.findById(schoolId);
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    const schoolCode = school.code;

    // Add the test type to the class
    const TestDetails = require('../models/TestDetails');
    const updatedTestDetails = await TestDetails.addTestTypeToClass(
      schoolCode,
      className,
      testType,
      academicYear,
      req.user._id
    );

    // Get the updated test types for the class
    const updatedClassTestTypes = updatedTestDetails.classTestTypes.get(className) || [];

    res.json({
      success: true,
      data: {
        schoolId,
        schoolCode,
        className,
        testTypes: updatedClassTestTypes,
        academicYear
      },
      message: `Test type ${testType.name} added successfully to class ${className}`
    });
  } catch (error) {
    console.error('Error adding test type to class:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding test type to class',
      error: error.message
    });
  }
};

/**
 * Remove test type from a specific class (superadmin access)
 */
exports.removeTestTypeFromClass = async (req, res) => {
  try {
    const { schoolId, className, testTypeCode } = req.params;
    const academicYear = req.query.academicYear || '2024-25';

    // Verify superadmin role
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Superadmin access required.'
      });
    }

    if (!testTypeCode) {
      return res.status(400).json({
        success: false,
        message: 'Test type code is required'
      });
    }

    // Find the school
    const School = require('../models/School');
    const school = await School.findById(schoolId);
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    const schoolCode = school.code;

    // Remove the test type from the class
    const TestDetails = require('../models/TestDetails');
    const updatedTestDetails = await TestDetails.removeTestTypeFromClass(
      schoolCode,
      className,
      testTypeCode,
      academicYear,
      req.user._id
    );

    // Get the updated test types for the class
    const updatedClassTestTypes = updatedTestDetails.classTestTypes.get(className) || [];

    res.json({
      success: true,
      data: {
        schoolId,
        schoolCode,
        className,
        testTypes: updatedClassTestTypes,
        academicYear
      },
      message: `Test type with code ${testTypeCode} removed successfully from class ${className}`
    });
  } catch (error) {
    console.error('Error removing test type from class:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing test type from class',
      error: error.message
    });
  }
};

/**
 * Get all test details for a school (superadmin access)
 */
exports.getSchoolTestDetails = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const academicYear = req.query.academicYear || '2024-25';

    // Verify superadmin role
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Superadmin access required.'
      });
    }

    // Find the school
    const School = require('../models/School');
    const school = await School.findById(schoolId);
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    const schoolCode = school.code;

    // Get test details for the school
    const TestDetails = require('../models/TestDetails');
    const testDetails = await TestDetails.findOne({
      schoolCode,
      academicYear
    });

    if (!testDetails) {
      // Return empty test details structure instead of creating default ones
      return res.json({
        success: true,
        data: {
          schoolId,
          schoolCode,
          classes: [], // Empty classes array
          academicYear
        },
        message: 'No test details found - empty configuration'
      });
    }

    // Convert Map to array format for frontend
    const classes = [];
    testDetails.classTestTypes.forEach((testTypes, className) => {
      classes.push({
        className,
        testTypes: testTypes || []
      });
    });

    res.json({
      success: true,
      data: {
        schoolId,
        schoolCode,
        classes,
        academicYear
      }
    });
  } catch (error) {
    console.error('Error fetching school test details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching school test details',
      error: error.message
    });
  }
};

/**
 * Get test types for a specific class in a school (superadmin access)
 */
exports.getSchoolClassTestTypes = async (req, res) => {
  try {
    const { schoolId, className } = req.params;
    const academicYear = req.query.academicYear || '2024-25';

    // Verify superadmin role
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Superadmin access required.'
      });
    }

    // Find the school
    const School = require('../models/School');
    const school = await School.findById(schoolId);
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    const schoolCode = school.code;

    // Get test details for the school
    const TestDetails = require('../models/TestDetails');
    const testDetails = await TestDetails.findOne({
      schoolCode,
      academicYear
    });

    if (!testDetails) {
      return res.status(404).json({
        success: false,
        message: 'Test details not found'
      });
    }

    const classTestTypes = testDetails.classTestTypes.get(className) || [];

    res.json({
      success: true,
      data: {
        schoolId,
        schoolCode,
        className,
        testTypes: classTestTypes,
        academicYear
      }
    });
  } catch (error) {
    console.error('Error fetching class test types:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching class test types',
      error: error.message
    });
  }
};

/**
 * Update academic settings for a school
 */
exports.updateSchoolAcademicSettings = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { 
      schoolTypes, 
      classes, 
      academicYear 
    } = req.body;

    // Verify superadmin role for this operation
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ 
        success: false,
        message: 'Only superadmins can update school academic settings' 
      });
    }

    // Find school by ID
    const School = require('../models/School');
    const school = await School.findById(schoolId);

    if (!school) {
      return res.status(404).json({ 
        success: false,
        message: 'School not found' 
      });
    }

    // Update school types if provided
    if (schoolTypes && Array.isArray(schoolTypes)) {
      // Create new schema field if it doesn't exist
      if (!school.academicSettings) {
        school.academicSettings = {};
      }
      school.academicSettings.schoolTypes = schoolTypes;
    }

    // Update classes if provided
    if (classes && Array.isArray(classes)) {
      // Update the classes array in settings
      school.settings = school.settings || {};
      school.settings.classes = classes;
      
      // Update test details for the new class structure
      await updateTestDetailsForClasses(school, classes, req.user._id);
    }

    // Update academic year if provided
    if (academicYear) {
      school.settings = school.settings || {};
      school.settings.academicYear = school.settings.academicYear || {};
      school.settings.academicYear.currentYear = academicYear;
    }

    await school.save();

    res.json({
      success: true,
      data: {
        schoolId: school._id,
        schoolCode: school.code,
        academicSettings: school.academicSettings,
        classes: school.settings?.classes || [],
        academicYear: school.settings?.academicYear?.currentYear || ''
      },
      message: 'School academic settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating school academic settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating school academic settings',
      error: error.message
    });
  }
};

// Helper function to update test details when classes change
async function updateTestDetailsForClasses(school, classes, userId) {
  try {
    const currentYear = school.settings?.academicYear?.currentYear || '2024-25';
    
    // Find existing test details
    const TestDetails = require('../models/TestDetails');
    let testDetails = await TestDetails.findOne({
      schoolCode: school.code,
      academicYear: currentYear
    });

    if (!testDetails) {
      // If no test details exist, create default ones
      return await TestDetails.createDefaultTestTypes(
        school._id,
        school.code,
        userId
      );
    }

    // Get current class test types map
    const classTestTypes = testDetails.classTestTypes || new Map();
    
    // Create a new map with updated classes
    const updatedClassTestTypes = new Map();
    
    // For each class, either keep existing test types or create default ones
    for (const className of classes) {
      if (classTestTypes.has(className)) {
        // Keep existing test types for this class
        updatedClassTestTypes.set(className, classTestTypes.get(className));
      } else {
        // Create default test types for new class
        const defaultTestTypes = [
          { name: 'Formative Assessment 1', code: 'FA-1', description: 'First Formative Assessment', maxMarks: 20, weightage: 0.1, isActive: true },
          { name: 'Formative Assessment 2', code: 'FA-2', description: 'Second Formative Assessment', maxMarks: 20, weightage: 0.1, isActive: true },
          { name: 'Midterm Examination', code: 'MIDTERM', description: 'Midterm Examination', maxMarks: 80, weightage: 0.3, isActive: true },
          { name: 'Summative Assessment 1', code: 'SA-1', description: 'First Summative Assessment', maxMarks: 80, weightage: 0.3, isActive: true },
          { name: 'Summative Assessment 2', code: 'SA-2', description: 'Second Summative Assessment', maxMarks: 80, weightage: 0.3, isActive: true }
        ];
        updatedClassTestTypes.set(className, defaultTestTypes);
      }
    }
    
    // Update the test details with the new class test types
    testDetails.classTestTypes = updatedClassTestTypes;
    testDetails.updatedBy = userId;
    
    return await testDetails.save();
  } catch (error) {
    console.error('Error updating test details for classes:', error);
    throw error;
  }
}
