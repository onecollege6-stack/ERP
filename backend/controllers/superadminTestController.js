const School = require('../models/School');
const SchoolDatabaseManager = require('../utils/schoolDatabaseManager');
const { ObjectId } = require('mongodb');

// Helper function to get school database connection with fallback creation
async function getSchoolConnectionWithFallback(schoolCode) {
  try {
    return await SchoolDatabaseManager.getSchoolConnection(schoolCode);
  } catch (error) {
    console.error(`Failed to connect to school database for ${schoolCode}:`, error);
    // Try to create the database if it doesn't exist
    try {
      await SchoolDatabaseManager.createSchoolDatabase(schoolCode);
      return await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    } catch (createError) {
      console.error(`Failed to create school database for ${schoolCode}:`, createError);
      throw new Error(`Error accessing school database: ${createError.message}`);
    }
  }
}

// Get all tests for a school
exports.getSchoolTests = async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    // Get school information
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Get school database connection
    const schoolConnection = await getSchoolConnectionWithFallback(school.code);
    const testDetailsCollection = schoolConnection.collection('testdetails');

    // Fetch all tests (no need for isActive filter since we're doing hard deletes)
    const tests = await testDetailsCollection.find({
      schoolId: schoolId
    }).sort({ createdAt: -1 }).toArray();

    console.log('Fetched tests for school:', school.code);
    console.log('Tests found:', tests.map(t => ({ _id: t._id, name: t.name, className: t.className })));

    res.json({
      success: true,
      data: {
        schoolId: schoolId,
        schoolName: school.name,
        schoolCode: school.code,
        tests: tests,
        totalTests: tests.length
      }
    });

  } catch (error) {
    console.error('Error fetching school tests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching school tests',
      error: error.message
    });
  }
};

// Add a new test
exports.addTest = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { name, className, description, maxMarks = 100, weightage = 25, sections = [] } = req.body;

    // Validate input
    if (!name || !className) {
      return res.status(400).json({
        success: false,
        message: 'Test name and class name are required'
      });
    }

    // Get school information
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Get school database connection
    const schoolConnection = await getSchoolConnectionWithFallback(school.code);
    const testDetailsCollection = schoolConnection.collection('testdetails');

    // Check if test already exists for this class
    const existingTest = await testDetailsCollection.findOne({
      schoolId: schoolId,
      name: name,
      className: className,
      isActive: true
    });

    if (existingTest) {
      return res.status(400).json({
        success: false,
        message: `Test "${name}" already exists for Class ${className}`
      });
    }

    // Generate test ID
    const testId = `${school.code}_${className}_${name.replace(/\s+/g, '_')}_${Date.now()}`;

    // Create new test document
    const newTest = {
      testId: testId,
      name: name,
      className: className,
      description: description || `Test for Class ${className}`,
      maxMarks: maxMarks,
      weightage: weightage,
      sections: sections, // Array of sections this test applies to
      schoolId: schoolId,
      schoolCode: school.code,
      academicYear: '2024-25',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert new test
    const result = await testDetailsCollection.insertOne(newTest);

    res.status(201).json({
      success: true,
      message: `Test "${name}" created successfully for Class ${className}`,
      data: {
        _id: result.insertedId,
        testId: testId,
        name: name,
        className: className,
        sections: sections
      }
    });

  } catch (error) {
    console.error('Error adding test:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding test',
      error: error.message
    });
  }
};

// Update test information
exports.updateTest = async (req, res) => {
  try {
    const { schoolId, testId } = req.params;
    const updateData = req.body;

    // Get school information
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Get school database connection
    const schoolConnection = await getSchoolConnectionWithFallback(school.code);
    const testDetailsCollection = schoolConnection.collection('testdetails');

    // Convert testId to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(testId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid test ID format'
      });
    }

    // Update test
    const result = await testDetailsCollection.updateOne(
      { 
        _id: objectId,
        schoolId: schoolId,
        isActive: true 
      },
      { 
        $set: { 
          ...updateData,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Test not found or no changes made'
      });
    }

    res.json({
      success: true,
      message: 'Test updated successfully'
    });

  } catch (error) {
    console.error('Error updating test:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating test',
      error: error.message
    });
  }
};

// Delete test (soft delete)
exports.deleteTest = async (req, res) => {
  try {
    const { schoolId, testId } = req.params;
    
    console.log('Delete test request:', { schoolId, testId });

    // Get school information
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Get school database connection
    const schoolConnection = await getSchoolConnectionWithFallback(school.code);
    const testDetailsCollection = schoolConnection.collection('testdetails');

    // First, let's see what tests exist in the collection
    const allTests = await testDetailsCollection.find({ schoolId: schoolId }).toArray();
    console.log('All tests in collection:', allTests.map(t => ({ _id: t._id, name: t.name })));
    
    // First, let's check if the test exists
    console.log('Searching for test with string ID:', testId);
    const testQuery = { schoolId: schoolId };
    
    // Try to find the test first with string ID (in case it's stored as string)
    let existingTest = await testDetailsCollection.findOne({
      ...testQuery,
      _id: testId
    });
    
    console.log('Test found with string ID:', existingTest ? 'YES' : 'NO');
    
    if (!existingTest) {
      // Try with ObjectId conversion
      let objectId;
      try {
        objectId = new ObjectId(testId);
        console.log('Converted to ObjectId:', objectId);
        
        existingTest = await testDetailsCollection.findOne({
          ...testQuery,
          _id: objectId
        });
        
        console.log('Test found with ObjectId:', existingTest ? 'YES' : 'NO');
        
        if (!existingTest) {
          console.log('Test not found with either string or ObjectId');
          return res.status(404).json({
            success: false,
            message: 'Test not found'
          });
        }
        
        // Hard delete with ObjectId
        console.log('Attempting to hard delete test with ObjectId:', objectId);
        const result = await testDetailsCollection.deleteOne({
          _id: objectId,
          schoolId: schoolId
        });
        
        console.log('Hard delete result with ObjectId:', result);
        
        if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
            message: 'Test not found'
          });
        }
        
      } catch (error) {
        console.log('ObjectId conversion failed:', error.message);
        return res.status(400).json({
          success: false,
          message: 'Invalid test ID format'
        });
      }
    } else {
      // Hard delete with string ID
      console.log('Attempting to hard delete test with string ID:', testId);
      const result = await testDetailsCollection.deleteOne({
        _id: testId,
        schoolId: schoolId
      });
      
      console.log('Hard delete result with string ID:', result);
      
      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Test not found'
        });
      }
    }

    res.json({
      success: true,
      message: 'Test deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting test',
      error: error.message
    });
  }
};

// Get tests for a specific class
exports.getTestsByClass = async (req, res) => {
  try {
    const { schoolId, className } = req.params;
    
    // Get school information
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ 
        success: false,
        message: 'School not found' 
      });
    }

    // Get school database connection
    const schoolConnection = await getSchoolConnectionWithFallback(school.code);
    const testDetailsCollection = schoolConnection.collection('testdetails');

    // Fetch tests for specific class
    const tests = await testDetailsCollection.find({
      schoolId: schoolId,
      className: className,
      isActive: true
    }).sort({ createdAt: -1 }).toArray();

    res.json({
      success: true,
      data: {
        schoolId: schoolId,
        className: className,
        tests: tests,
        totalTests: tests.length
      }
    });

  } catch (error) {
    console.error('Error fetching tests by class:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tests by class',
      error: error.message
    });
  }
};