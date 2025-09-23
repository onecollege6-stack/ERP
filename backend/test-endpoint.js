const axios = require('axios');

async function testTestDetailsEndpoint() {
  try {
    const schoolId = '68bf1e4bf00b0d5269ae77b4';
    
    // You'll need to get a valid superadmin token first
    // For now, let's just test if the endpoint is reachable
    const response = await axios.get(`http://localhost:5050/api/test-details/${schoolId}`, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
      }
    });
    
    console.log('Test Details Response:', response.data);
  } catch (error) {
    console.error('Error testing endpoint:', error.response?.data || error.message);
  }
}

// For now, just check if we can connect to the server
async function testConnection() {
  try {
    const response = await axios.get('http://localhost:5050/api/health');
    console.log('Server is running');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('Server is not running');
    } else {
      console.log('Server responded with error:', error.response?.status);
    }
  }
}

testConnection();
