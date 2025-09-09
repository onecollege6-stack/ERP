const TestDetails = require('../models/TestDetails');

// Get test details for a school
exports.getTestDetails = async (req, res) => {
  try {
    const schoolCode = req.user.schoolCode;
    const academicYear = req.query.academicYear || '2024-25';

    const testDetails = await TestDetails.findOne({
      schoolCode,
      academicYear
    });

    if (!testDetails) {
      // Create default test details if none exist
      const newTestDetails = await TestDetails.createDefaultTestTypes(
        req.user.schoolId,
        schoolCode,
        req.user._id
      );
      
      return res.json({
        success: true,
        data: newTestDetails,
        message: 'Test details created with default types'
      });
    }

    res.json({
      success: true,
      data: testDetails
    });
  } catch (error) {
    console.error('Error fetching test details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching test details',
      error: error.message
    });
  }
};

// Update test details for a school
exports.updateTestDetails = async (req, res) => {
  try {
    const { testTypes } = req.body;
    const schoolCode = req.user.schoolCode;
    const academicYear = req.body.academicYear || '2024-25';

    if (!testTypes || !Array.isArray(testTypes)) {
      return res.status(400).json({
        success: false,
        message: 'Test types array is required'
      });
    }

    // Validate test types
    for (const testType of testTypes) {
      if (!testType.name || !testType.code) {
        return res.status(400).json({
          success: false,
          message: 'Each test type must have a name and code'
        });
      }
    }

    let testDetails = await TestDetails.findOne({
      schoolCode,
      academicYear
    });

    if (!testDetails) {
      // Create new test details
      testDetails = new TestDetails({
        schoolId: req.user.schoolId,
        schoolCode,
        academicYear,
        testTypes,
        createdBy: req.user._id
      });
    } else {
      // Update existing test details
      testDetails.testTypes = testTypes;
      testDetails.updatedBy = req.user._id;
    }

    await testDetails.save();

    res.json({
      success: true,
      data: testDetails,
      message: 'Test details updated successfully'
    });
  } catch (error) {
    console.error('Error updating test details:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating test details',
      error: error.message
    });
  }
};

// Get test details for superadmin (by school)
exports.getSchoolTestDetails = async (req, res) => {
  try {
    const { schoolCode } = req.params;
    const academicYear = req.query.academicYear || '2024-25';

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const testDetails = await TestDetails.findOne({
      schoolCode: schoolCode.toUpperCase(),
      academicYear
    }).populate('schoolId', 'name code');

    if (!testDetails) {
      return res.status(404).json({
        success: false,
        message: 'Test details not found for this school'
      });
    }

    res.json({
      success: true,
      data: testDetails
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

// Update test details for a school (superadmin)
exports.updateSchoolTestDetails = async (req, res) => {
  try {
    const { schoolCode } = req.params;
    const { testTypes } = req.body;
    const academicYear = req.body.academicYear || '2024-25';

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!testTypes || !Array.isArray(testTypes)) {
      return res.status(400).json({
        success: false,
        message: 'Test types array is required'
      });
    }

    const testDetails = await TestDetails.findOneAndUpdate(
      {
        schoolCode: schoolCode.toUpperCase(),
        academicYear
      },
      {
        testTypes,
        updatedBy: req.user._id
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!testDetails) {
      return res.status(404).json({
        success: false,
        message: 'Test details not found for this school'
      });
    }

    res.json({
      success: true,
      data: testDetails,
      message: 'School test details updated successfully'
    });
  } catch (error) {
    console.error('Error updating school test details:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating school test details',
      error: error.message
    });
  }
};

// Get test details by school ID (for superadmin)
exports.getTestDetailsBySchoolId = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const academicYear = req.query.academicYear || '2024-25';

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Superadmin access required.'
      });
    }

    // Find all test details for this school
    const testDetails = await TestDetails.find({
      schoolId,
      ...(academicYear ? { academicYear } : {})
    }).sort({ academicYear: -1 });

    res.json({
      success: true,
      testDetails: testDetails
    });
  } catch (error) {
    console.error('Error fetching test details by school ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching test details',
      error: error.message
    });
  }
};
