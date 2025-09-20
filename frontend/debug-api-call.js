// Debug test to check the API call
import { testDetailsAPI, TEST_DETAILS_CONFIG } from '../src/api/testDetails.js';

console.log('TEST_DETAILS_CONFIG:', TEST_DETAILS_CONFIG);
console.log('Default Academic Year:', TEST_DETAILS_CONFIG.defaultAcademicYear);

// Test the API call
try {
  console.log('Calling getTestDetailsBySchoolCode()...');
  const result = await testDetailsAPI.getTestDetailsBySchoolCode();
  console.log('Result:', result);
} catch (error) {
  console.log('Error details:', {
    message: error.message,
    response: error.response?.data,
    config: error.config
  });
}