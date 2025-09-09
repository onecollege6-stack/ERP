const axios = require('axios');

async function testWithAuthentication() {
  try {
    console.log('Testing with authentication flow...\n');
    
    // Step 1: Login to get the school information and token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@test.com',
      password: 'test123',
      schoolCode: 'p'
    });
    
    console.log('✅ Login successful');
    console.log('User:', loginResponse.data.user.name);
    console.log('Role:', loginResponse.data.user.role);
    console.log('School ID:', loginResponse.data.user.schoolId);
    console.log('School Name:', loginResponse.data.user.schoolName);
    
    // Set up axios with the token for subsequent requests
    const token = loginResponse.data.token;
    const schoolId = loginResponse.data.user.schoolId;
    
    if (!schoolId) {
      console.error('❌ No school ID found in user data');
      return;
    }
    
    // Step 2: Test the getSchoolUsers endpoint with authentication
    console.log('\n2. Fetching users for the authenticated school...');
    const usersResponse = await axios.get(`http://localhost:5000/api/schools/${schoolId}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ Users found: ${usersResponse.data.length}`);
    
    if (usersResponse.data.length > 0) {
      console.log('\nUser details:');
      usersResponse.data.forEach((user, index) => {
        console.log(`${index + 1}. Name: ${user.name?.displayName || user.name || 'N/A'}`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   ID: ${user._id || 'N/A'}`);
        console.log('');
      });
      
      // Test with role filter
      console.log('3. Testing with role filter (admin)...');
      const adminResponse = await axios.get(`http://localhost:5000/api/schools/${schoolId}/users?role=admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`Admin users found: ${adminResponse.data.length}`);
      
    } else {
      console.log('⚠️ No users found - this explains the "Failed to fetch users" error');
      console.log('The collections (admins, teachers, students, parents) might be empty or not accessible');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testWithAuthentication();
