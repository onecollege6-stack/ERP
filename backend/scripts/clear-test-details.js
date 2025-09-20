const { MongoClient } = require('mongodb');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const schoolDatabasePrefix = 'school_';

async function clearTestDetails() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get list of all databases
    const admin = client.db().admin();
    const databases = await admin.listDatabases();
    
    console.log('\nFound databases:', databases.databases.map(db => db.name));
    
    // Find school databases
    const schoolDatabases = databases.databases.filter(db => 
      db.name.startsWith(schoolDatabasePrefix)
    );
    
    console.log('\nSchool databases found:', schoolDatabases.map(db => db.name));
    
    if (schoolDatabases.length === 0) {
      console.log('No school databases found to clean.');
      return;
    }
    
    // Clear test details from each school database
    for (const dbInfo of schoolDatabases) {
      const schoolDb = client.db(dbInfo.name);
      console.log(`\nProcessing database: ${dbInfo.name}`);
      
      try {
        // Check if testDetails collection exists
        const collections = await schoolDb.listCollections({ name: 'testDetails' }).toArray();
        
        if (collections.length > 0) {
          const testDetailsCollection = schoolDb.collection('testDetails');
          
          // Get count before deletion
          const beforeCount = await testDetailsCollection.countDocuments();
          console.log(`  Found ${beforeCount} test detail documents`);
          
          // Delete all test details
          const deleteResult = await testDetailsCollection.deleteMany({});
          console.log(`  Deleted ${deleteResult.deletedCount} test detail documents`);
          
          // Optionally drop the collection entirely
          // await testDetailsCollection.drop();
          // console.log(`  Dropped testDetails collection`);
          
        } else {
          console.log(`  No testDetails collection found in ${dbInfo.name}`);
        }
        
      } catch (error) {
        console.error(`  Error processing ${dbInfo.name}:`, error.message);
      }
    }
    
    console.log('\nTest details cleanup completed!');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the cleanup
console.log('Starting test details cleanup...');
clearTestDetails()
  .then(() => {
    console.log('Cleanup script finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('Cleanup script failed:', error);
    process.exit(1);
  });
