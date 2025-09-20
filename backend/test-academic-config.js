/**
 * Test file for academic test configuration in superadmin panel
 */
const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const SUPERADMIN_TOKEN = process.env.SUPERADMIN_TOKEN;

// Helper function to get a superadmin token
async function getSuperadminToken() {
  try {
    // If token is provided in env, use it
    if (SUPERADMIN_TOKEN) {
      return SUPERADMIN_TOKEN;
    }
    
    // Otherwise, log in to get a token
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'superadmin@test.com',
      password: 'password123'
    });
    
    return loginResponse.data.token;
  } catch (error) {
    console.error('Error getting superadmin token:', error.message);
    throw error;
  }
}

// Test function for academic settings
async function testAcademicSettings() {
  try {
    const token = await getSuperadminToken();
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    // Get a school ID to test with
    const schoolsResponse = await axios.get(`${API_URL}/schools`, config);
    const schoolId = schoolsResponse.data.schools[0]._id;
    
    console.log(`Testing with school ID: ${schoolId}`);
    
    // 1. Update school academic settings
    const updateSettingsResponse = await axios.put(
      `${API_URL}/superadmin/academic/schools/${schoolId}/settings`,
      {
        schoolTypes: ['Primary', 'Secondary'],
        classes: ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
      },
      config
    );
    
    console.log('Updated academic settings:', updateSettingsResponse.data);
    
    // 2. Get all test details for the school
    const testDetailsResponse = await axios.get(
      `${API_URL}/superadmin/academic/schools/${schoolId}/tests`,
      config
    );
    
    console.log('Test details:', testDetailsResponse.data);
    
    // 3. Add a new test type to a class
    const addTestTypeResponse = await axios.post(
      `${API_URL}/superadmin/academic/schools/${schoolId}/tests/class/5`,
      {
        testType: {
          name: 'Special Assessment',
          code: 'SPECIAL',
          description: 'Special assessment for testing',
          maxMarks: 50,
          weightage: 0.2
        }
      },
      config
    );
    
    console.log('Added test type:', addTestTypeResponse.data);
    
    // 4. Get test types for a specific class
    const classTestTypesResponse = await axios.get(
      `${API_URL}/superadmin/academic/schools/${schoolId}/tests/class/5`,
      config
    );
    
    console.log('Class test types:', classTestTypesResponse.data);
    
    // 5. Remove the test type we just added
    const removeTestTypeResponse = await axios.delete(
      `${API_URL}/superadmin/academic/schools/${schoolId}/tests/class/5/test/SPECIAL`,
      config
    );
    
    console.log('Removed test type:', removeTestTypeResponse.data);
    
    console.log('All tests completed successfully');
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the tests
testAcademicSettings();
