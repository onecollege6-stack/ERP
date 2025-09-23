const axios = require('axios');

async function testSchoolUsersAPI() {
  try {
    console.log('Testing school users API...');
    
    // First, let's get the list of schools to find a valid schoolId
    const schoolsResponse = await axios.get('http://localhost:5050/schools');
    console.log('Available schools:', schoolsResponse.data.length);
    
    if (schoolsResponse.data.length > 0) {
      const firstSchool = schoolsResponse.data[0];
      console.log('Testing with school:', firstSchool.name, 'ID:', firstSchool._id);
      
      // Test the getSchoolUsers endpoint
      const usersResponse = await axios.get(`http://localhost:5050/schools/${firstSchool._id}/users`);
      console.log('Users found:', usersResponse.data.length);
      console.log('Users data:', JSON.stringify(usersResponse.data, null, 2));
    } else {
      console.log('No schools found to test with');
    }
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
  }
}

testSchoolUsersAPI();
