// backend/controllers/schoolController.js - Add these functions

// Update school academic settings - includes school types and class configuration
exports.updateSchoolAcademicSettings = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { 
      schoolTypes, 
      affiliationBoard,
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

    // Find school by ID or code
    let school = null;
    try {
      if (schoolId) school = await School.findById(schoolId);
    } catch (err) {
      // Ignore cast error and try by code
      school = null;
    }

    if (!school) {
      // Try by code (case-insensitive)
      school = await School.findOne({ code: new RegExp(`^${schoolId}$`, 'i') });
    }

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

    // Update affiliation board if provided
    if (affiliationBoard) {
      school.affiliationBoard = affiliationBoard;
    }

    // Update classes if provided
    if (classes && Array.isArray(classes)) {
      // Update the classes array in settings
      school.settings = school.settings || {};
      school.settings.classes = classes;
      
      // This will trigger test details update for the new class structure
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
        // Create empty test types array for new class
        updatedClassTestTypes.set(className, []);
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
