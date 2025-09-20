/**
 * This script tests all superadmin API routes to ensure they're correctly configured
 * Run it to verify route paths are correct after modifications
 */
const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
let token = '';

// Helper function to get a superadmin token
async function getSuperadminToken() {
  try {
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: process.env.SUPERADMIN_EMAIL || 'superadmin@test.com',
      password: process.env.SUPERADMIN_PASSWORD || 'password123'
    });
    
    return loginResponse.data.token;
  } catch (error) {
    console.error('Error getting superadmin token:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    throw error;
  }
}

// Function to test a route
async function testRoute(method, url, data = null) {
  try {
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log(`Testing ${method.toUpperCase()} ${url}...`);
    
    let response;
    if (method.toLowerCase() === 'get') {
      response = await axios.get(url, config);
    } else if (method.toLowerCase() === 'post') {
      response = await axios.post(url, data, config);
    } else if (method.toLowerCase() === 'put') {
      response = await axios.put(url, data, config);
    } else if (method.toLowerCase() === 'delete') {
      response = await axios.delete(url, config);
    }
    
    console.log(`✅ ${method.toUpperCase()} ${url} - Status: ${response.status}`);
    return { success: true, response };
  } catch (error) {
    console.error(`❌ ${method.toUpperCase()} ${url} - Error: ${error.message}`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return { success: false, error };
  }
}

// Main test function
async function testSuperadminRoutes() {
  try {
    console.log('🧪 Starting superadmin routes test...\n');
    
    // Get superadmin token
    console.log('Getting superadmin token...');
    token = await getSuperadminToken();
    console.log('✅ Got superadmin token\n');
    
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    // Get a school ID to test with
    console.log('Getting a school ID to test with...');
    const schoolsResponse = await axios.get(`${API_URL}/superadmin/schools`, config);
    
    if (!schoolsResponse.data.schools || schoolsResponse.data.schools.length === 0) {
      throw new Error('No schools found. Please create a school first.');
    }
    
    const schoolId = schoolsResponse.data.schools[0]._id;
    console.log(`✅ Using school with ID: ${schoolId}\n`);
    
    // Test superadmin school routes
    await testRoute('get', `${API_URL}/superadmin/schools`);
    
    // Test superadmin academic routes
    console.log('\n🔍 Testing Academic Routes:');
    
    // Academic settings
    await testRoute('get', `${API_URL}/superadmin/academic/schools/${schoolId}/settings`);
    await testRoute('put', `${API_URL}/superadmin/academic/schools/${schoolId}/settings`, {
      schoolTypes: ['Primary', 'Secondary'],
      classes: ['LKG', 'UKG', '1', '2', '3', '4', '5']
    });
    
    // Test details
    await testRoute('get', `${API_URL}/superadmin/academic/schools/${schoolId}/tests`);
    
    // Add a test type to a class
    await testRoute('post', `${API_URL}/superadmin/academic/schools/${schoolId}/tests/class/5`, {
      testType: {
        name: 'Route Test',
        code: 'RT',
        description: 'Testing route configuration',
        maxMarks: 50,
        weightage: 0.2
      }
    });
    
    // Get test types for a class
    await testRoute('get', `${API_URL}/superadmin/academic/schools/${schoolId}/tests/class/5`);
    
    // Remove the test type
    await testRoute('delete', `${API_URL}/superadmin/academic/schools/${schoolId}/tests/class/5/test/RT`);
    
    console.log('\n🎉 All route tests completed!');
    
  } catch (error) {
    console.error('\n❌ Route testing failed:', error.message);
  }
}

// Run the tests
testSuperadminRoutes();
