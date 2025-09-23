const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing school login for admin...');
    
    const adminResponse = await axios.post('http://localhost:5050/api/auth/school-login', {
      identifier: 'admin@test.com',
      password: 't8qW7Y58',
      schoolCode: 'p'
    });
    
    console.log('✅ Admin login successful!');
    console.log('User:', adminResponse.data.user.name);
    console.log('Role:', adminResponse.data.user.role);
    console.log('Token:', adminResponse.data.token ? 'Generated' : 'Missing');
    
    console.log('\nTesting school login for teacher...');
    
    const teacherResponse = await axios.post('http://localhost:5050/api/auth/school-login', {
      identifier: 'teacher@test.com',
      password: 'fFvja2L5',
      schoolCode: 'p'
    });
    
    console.log('✅ Teacher login successful!');
    console.log('User:', teacherResponse.data.user.name);
    console.log('Role:', teacherResponse.data.user.role);
    console.log('Token:', teacherResponse.data.token ? 'Generated' : 'Missing');
    
  } catch (error) {
    console.error('❌ Login test failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
  }
}

testLogin();
