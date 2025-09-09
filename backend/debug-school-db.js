require('dotenv').config();
const DatabaseManager = require('./utils/databaseManager');

async function debugSchoolDatabase() {
  try {
    console.log('🔍 Debugging school database structure...');
    
    // Initialize database manager
    await DatabaseManager.initialize();
    
    // Get school connection
    const schoolConnection = await DatabaseManager.getSchoolConnection('p');
    console.log('✅ Connected to school_p database');
    
    // List all collections
    const collections = await schoolConnection.db.listCollections().toArray();
    console.log('📋 Collections in school_p database:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });
    
    // Check users collection
    if (collections.find(c => c.name === 'users')) {
      console.log('\n👥 Examining users collection:');
      const usersCollection = schoolConnection.collection('users');
      const userCount = await usersCollection.countDocuments();
      console.log(`  Total users: ${userCount}`);
      
      // Find all users to see the structure
      const users = await usersCollection.find({}).limit(5).toArray();
      console.log('  Sample users:');
      users.forEach(user => {
        console.log(`    - ${JSON.stringify({
          _id: user._id,
          userId: user.userId,
          email: user.email,
          role: user.role,
          name: user.name
        }, null, 2)}`);
      });
      
      // Look specifically for P-A-0004
      console.log('\n🔍 Looking for user P-A-0004:');
      const targetUser = await usersCollection.findOne({ userId: 'P-A-0004' });
      if (targetUser) {
        console.log('✅ Found P-A-0004:', JSON.stringify(targetUser, null, 2));
      } else {
        console.log('❌ P-A-0004 not found');
        
        // Try different search criteria
        const byEmail = await usersCollection.findOne({ email: 'admin@test.com' });
        if (byEmail) {
          console.log('✅ Found by email admin@test.com:', JSON.stringify(byEmail, null, 2));
        }
        
        // List all userIds
        const allUserIds = await usersCollection.find({}, { projection: { userId: 1, email: 1, _id: 0 } }).toArray();
        console.log('📝 All userIds in database:');
        allUserIds.forEach(user => {
          console.log(`    - userId: ${user.userId}, email: ${user.email}`);
        });
      }
    }
    
    // Check other possible collections
    const otherCollections = ['admins', 'teachers', 'staff'];
    for (const collectionName of otherCollections) {
      if (collections.find(c => c.name === collectionName)) {
        console.log(`\n👥 Examining ${collectionName} collection:`);
        const collection = schoolConnection.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`  Total documents: ${count}`);
        
        if (count > 0) {
          const docs = await collection.find({}).limit(3).toArray();
          console.log('  Sample documents:');
          docs.forEach(doc => {
            console.log(`    - ${JSON.stringify({
              _id: doc._id,
              userId: doc.userId,
              email: doc.email,
              role: doc.role
            }, null, 2)}`);
          });
          
          // Look for P-A-0004
          const targetUser = await collection.findOne({ userId: 'P-A-0004' });
          if (targetUser) {
            console.log(`✅ Found P-A-0004 in ${collectionName}:`, JSON.stringify(targetUser, null, 2));
          }
        }
      }
    }
    
    console.log('\n🏁 Debug complete');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error debugging school database:', error);
    process.exit(1);
  }
}

debugSchoolDatabase();
