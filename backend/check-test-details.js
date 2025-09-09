const mongoose = require('mongoose');
const TestDetails = require('./models/TestDetails');
const School = require('./models/School');
require('dotenv').config();

async function checkTestDetails() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const schoolId = '68bf1e4bf00b0d5269ae77b4';
    
    // First, check if this school exists
    const school = await School.findById(schoolId);
    if (!school) {
      console.log('School not found with ID:', schoolId);
      return;
    }
    
    console.log(`Found school: ${school.name} (${school.code})`);
    
    // Check for test details
    const testDetails = await TestDetails.find({ schoolId });
    console.log(`Found ${testDetails.length} test details documents for school ${school.code}:`);
    
    testDetails.forEach((testDoc, index) => {
      console.log(`Document ${index + 1}: Academic Year ${testDoc.academicYear}`);
      console.log(`  Test Types: ${testDoc.testTypes.length}`);
      testDoc.testTypes.forEach((testType, testIndex) => {
        console.log(`    ${testIndex + 1}. ${testType.name} (${testType.code}) - Max: ${testType.maxMarks}, Weight: ${testType.weightage} - Active: ${testType.isActive}`);
      });
    });

    if (testDetails.length === 0) {
      console.log('No test details found. Creating default test types...');
      try {
        await TestDetails.createDefaultTestTypes(schoolId, school.code, null);
        console.log('Default test types created successfully!');
        
        // Fetch again to confirm
        const newTestDetails = await TestDetails.find({ schoolId });
        console.log(`After creation, found ${newTestDetails.length} test details documents:`);
        newTestDetails.forEach((testDoc, index) => {
          console.log(`Document ${index + 1}: Academic Year ${testDoc.academicYear}`);
          console.log(`  Test Types: ${testDoc.testTypes.length}`);
          testDoc.testTypes.forEach((testType, testIndex) => {
            console.log(`    ${testIndex + 1}. ${testType.name} (${testType.code}) - Max: ${testType.maxMarks}, Weight: ${testType.weightage} - Active: ${testType.isActive}`);
          });
        });
      } catch (createError) {
        console.error('Error creating default test types:', createError);
      }
    }

  } catch (error) {
    console.error('Error checking test details:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkTestDetails();
