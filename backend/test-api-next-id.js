const fetch = require('node-fetch');

async function testNextIdAPI() {
  try {
    console.log('🧪 Testing /api/users/next-id/student endpoint');
    
    // First, let's try to get a token by logging in
    const loginResponse = await fetch('http://localhost:5050/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'test123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    
    const token = loginData.token;
    
    // Now test the next-id endpoint
    const nextIdResponse = await fetch('http://localhost:5050/api/users/next-id/student', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Response status: ${nextIdResponse.status}`);
    
    const responseText = await nextIdResponse.text();
    console.log(`📄 Response body: ${responseText}`);
    
    if (nextIdResponse.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Success! Next ID:', data.nextUserId);
    } else {
      console.error('❌ API Error:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNextIdAPI();
