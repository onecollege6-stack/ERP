const mongoose = require('mongoose');
require('dotenv').config();

const TestDetails = require('./models/TestDetails');

// Helper function to convert Map to object for JSON serialization
const convertMapToObject = (testDetails) => {
  const responseData = testDetails.toObject();
  if (responseData.classTestTypes instanceof Map) {
    responseData.classTestTypes = Object.fromEntries(responseData.classTestTypes);
  }
  return responseData;
};

async function testTestDetailsAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find test details for school code "P"
    const testDetails = await TestDetails.findOne({
      schoolCode: 'P',
      academicYear: '2024-25'
    });

    console.log('Found test details:', JSON.stringify(testDetails, null, 2));

    if (testDetails && testDetails.classTestTypes) {
      console.log('Class test types (raw Map):', testDetails.classTestTypes);
      console.log('LKG test types (raw):', testDetails.classTestTypes.get('LKG') || testDetails.classTestTypes['LKG']);
      
      // Test the conversion
      const converted = convertMapToObject(testDetails);
      console.log('Converted classTestTypes:', converted.classTestTypes);
      console.log('Converted LKG test types:', converted.classTestTypes.LKG);
      
      // Test JSON serialization
      const jsonString = JSON.stringify(converted);
      const parsed = JSON.parse(jsonString);
      console.log('JSON parsed LKG test types:', parsed.classTestTypes.LKG);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testTestDetailsAPI();
