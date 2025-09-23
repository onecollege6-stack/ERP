const axios = require('axios');

async function testSchoolUsersWithCode() {
  try {
    console.log('Testing getSchoolUsers with school code "p"...\n');

    // Test the getSchoolUsers endpoint with school code
    const response = await axios.get('http://localhost:5050/api/schools/p/users');

    console.log(`✅ Success! Users found: ${response.data.length}`);
    console.log('\nUsers data:');

    if (response.data.length > 0) {
      response.data.forEach((user, index) => {
        console.log(`${index + 1}. Name: ${user.name?.displayName || user.name || 'N/A'}`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   ID: ${user._id || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No users found - the collections might be empty');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

testSchoolUsersWithCode();
