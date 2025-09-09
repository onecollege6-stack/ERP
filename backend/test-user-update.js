const axios = require('axios');

async function testSchoolUserUpdate() {
  try {
    console.log('🧪 Testing school user authentication and update...');
    
    // Step 1: Login as school user
    console.log('📝 Step 1: Logging in as school user...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/school-login', {
      identifier: 'admin@test.com',
      password: 'test123',
      schoolCode: 'p'
    });
    
    console.log('✅ Login successful:', {
      success: loginResponse.data.success,
      userType: loginResponse.data.user.role,
      userId: loginResponse.data.user.userId
    });
    
    const token = loginResponse.data.token;
    
    // Step 2: Test authentication with a simple endpoint
    console.log('\n📝 Step 2: Testing authentication...');
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    try {
      const authTestResponse = await axios.get('http://localhost:5000/api/school-users/p/users', {
        headers: authHeaders
      });
      console.log('✅ Authentication test successful - can access protected route');
    } catch (authError) {
      console.error('❌ Authentication test failed:', authError.response?.data || authError.message);
      return;
    }
    
    // Step 3: Try to update a user
    console.log('\n📝 Step 3: Testing user update...');
    const updateData = {
      'name.firstName': 'Updated Test',
      'name.lastName': 'Admin Updated',
      'contact.primaryPhone': '9999999999'
    };
    
    try {
      const updateResponse = await axios.put('http://localhost:5000/api/school-users/p/users/P-A-0004', updateData, {
        headers: authHeaders
      });
      console.log('✅ User update successful:', updateResponse.data);
    } catch (updateError) {
      console.error('❌ User update failed:', updateError.response?.data || updateError.message);
      console.error('Request details:', {
        url: 'http://localhost:5000/api/school-users/p/users/P-A-0004',
        method: 'PUT',
        headers: authHeaders,
        data: updateData
      });
    }
    
    console.log('\n🏁 Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSchoolUserUpdate();
