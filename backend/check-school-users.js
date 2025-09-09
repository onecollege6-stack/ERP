const SchoolDatabaseManager = require('./utils/schoolDatabaseManager');
const UserGenerator = require('./utils/userGenerator');

async function checkUsers() {
  try {
    console.log('Checking users in school_p database...');
    
    // Get all users by role
    const roles = ['admin', 'teacher', 'student', 'parent'];
    
    for (const role of roles) {
      try {
        const users = await UserGenerator.getUsersByRole('p', role);
        console.log(`${role}s: ${users.length} users`);
        if (users.length > 0) {
          console.log('Sample user:', {
            userId: users[0].userId,
            email: users[0].email,
            name: users[0].name,
            role: users[0].role
          });
        }
      } catch (error) {
        console.log(`Error getting ${role}s:`, error.message);
      }
    }
    
    // Also check the collections directly
    console.log('\nChecking collections directly...');
    const connection = await SchoolDatabaseManager.getSchoolConnection('p');
    
    const collections = ['admins', 'teachers', 'students', 'parents'];
    for (const collectionName of collections) {
      try {
        const collection = connection.collection(collectionName);
        const count = await collection.countDocuments();
        const realCount = await collection.countDocuments({ _placeholder: { $ne: true } });
        console.log(`${collectionName}: ${count} total documents (${realCount} real users)`);
        
        if (realCount > 0) {
          const sampleUser = await collection.findOne({ _placeholder: { $ne: true } });
          console.log('Sample:', {
            userId: sampleUser?.userId,
            email: sampleUser?.email,
            role: sampleUser?.role
          });
        }
      } catch (error) {
        console.log(`Error checking ${collectionName}:`, error.message);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
