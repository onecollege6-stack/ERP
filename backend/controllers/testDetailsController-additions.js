// Add these methods to the testDetailsController.js file

// Add a test type to a specific class
exports.addTestTypeToClass = async (req, res) => {
  try {
    const { className } = req.params;
    const { testType } = req.body;
    const schoolCode = req.user.schoolCode;
    const academicYear = req.body.academicYear || '2024-25';

    if (!testType || !testType.name || !testType.code) {
      return res.status(400).json({
        success: false,
        message: 'Test type must have a name and code'
      });
    }

    // Validate test type
    if (!testType.maxMarks || isNaN(testType.maxMarks)) {
      testType.maxMarks = 100; // Default max marks
    }

    if (!testType.weightage || isNaN(testType.weightage)) {
      testType.weightage = 1; // Default weightage
    }

    // Add the test type to the class
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

// Remove a test type from a specific class
exports.removeTestTypeFromClass = async (req, res) => {
  try {
    const { className, testTypeCode } = req.params;
    const schoolCode = req.user.schoolCode;
    const academicYear = req.query.academicYear || '2024-25';

    if (!testTypeCode) {
      return res.status(400).json({
        success: false,
        message: 'Test type code is required'
      });
    }

    // Remove the test type from the class
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
