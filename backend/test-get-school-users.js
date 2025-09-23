const axios = require('axios');

async function testGetSchoolUsers() {
  try {
    console.log('Testing getSchoolUsers API endpoint...\n');
    
    // Let's use a placeholder school ID - in real usage, this would come from authentication
    // For now, let's test with different potential school IDs
    const testSchoolIds = [
      '676d7c18708b8a76fb2096b7', // Example ObjectId format
      '507f1f77bcf86cd799439011', // Another example
      '507f191e810c19729de860ea'  // Another example
    ];
    
    for (const schoolId of testSchoolIds) {
      try {
        console.log(`Testing with school ID: ${schoolId}`);
        
        // Test the getSchoolUsers endpoint
        const usersResponse = await axios.get(`http://localhost:5050/api/schools/${schoolId}/users`);
        
        console.log(`✅ Success! Users found: ${usersResponse.data.length}`);
        console.log('\nUsers data:');
        
        if (usersResponse.data.length > 0) {
          usersResponse.data.forEach((user, index) => {
            console.log(`${index + 1}. Name: ${user.name?.displayName || user.name || 'N/A'}`);
            console.log(`   Role: ${user.role || 'N/A'}`);
            console.log(`   Email: ${user.email || 'N/A'}`);
            console.log(`   ID: ${user._id || 'N/A'}`);
            console.log('');
          });
          
          // Test with role filter
          console.log('Testing with role filter (admin)...');
          const adminResponse = await axios.get(`http://localhost:5050/api/schools/${schoolId}/users?role=admin`);
          console.log(`Admin users found: ${adminResponse.data.length}\n`);
          
          break; // Success, exit the loop
        } else {
          console.log('No users found for this school ID\n');
        }
        
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`❌ School not found with ID: ${schoolId}\n`);
        } else {
          console.error(`❌ Error with school ID ${schoolId}:`, error.response?.data || error.message);
          console.error('Status:', error.response?.status, '\n');
        }
      }
    }
    
  } catch (error) {
    console.error('General error:', error.message);
  }
}

testGetSchoolUsers();
