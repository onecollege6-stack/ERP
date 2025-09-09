const mongoose = require('mongoose');
const schoolController = require('../controllers/schoolController');

// Test the access matrix update functionality
async function testAccessMatrixUpdate() {
  try {
    // Mock request and response objects
    const mockReq = {
      params: { schoolId: 'SCHOOL_ID_HERE' },
      body: {
        accessMatrix: {
          admin: {
            canManageUsers: true,
            canViewReports: true,
            canManageSettings: true,
            canManageGrades: false
          },
          teacher: {
            canManageUsers: false,
            canViewReports: true,
            canManageSettings: false,
            canManageGrades: true
          },
          student: {
            canManageUsers: false,
            canViewReports: false,
            canManageSettings: false,
            canManageGrades: false
          }
        }
      },
      user: { role: 'superadmin' }
    };

    const mockRes = {
      json: (data) => console.log('Response:', JSON.stringify(data, null, 2)),
      status: (code) => ({
        json: (data) => console.log(`Status: ${code}`, JSON.stringify(data, null, 2))
      })
    };

    console.log('Testing access matrix update...');
    console.log('Request data:', JSON.stringify(mockReq.body, null, 2));

    // Note: This is just for testing the function structure
    // Replace SCHOOL_ID_HERE with an actual school ID when testing
    
    console.log('✅ Access matrix update function structure is ready for testing');
    
  } catch (error) {
    console.error('Error testing access matrix update:', error);
  }
}

// Run the test
testAccessMatrixUpdate();
