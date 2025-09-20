const dbManager = require('./utils/databaseManager');

async function testMultiTenantDatabase() {
  try {
    console.log('🧪 Testing Multi-Tenant Database Structure...\n');
    
    // Test different school codes (avoiding case conflicts)
    const schoolCodes = ['demo1', 'demo2', 'demo3'];
    
    for (const schoolCode of schoolCodes) {
      console.log(`📋 Testing school: ${schoolCode}`);
      
      // Get connection for this school
      const connection = await dbManager.getSchoolConnection(schoolCode);
      console.log(`✅ Connected to database: ${connection.db.databaseName}`);
      
      // List collections in this database
      const collections = await connection.db.listCollections().toArray();
      console.log(`📁 Collections in ${connection.db.databaseName}:`, 
        collections.map(c => c.name));
      
      // Test testdetails collection
      const testCollection = connection.db.collection('testdetails');
      
      // Create a sample test document
      const sampleTest = {
        testType: 'Unit Test',
        classes: [`${schoolCode.toUpperCase()}1A`, `${schoolCode.toUpperCase()}1B`],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };
      
      const result = await testCollection.insertOne(sampleTest);
      console.log(`✅ Inserted test document with ID: ${result.insertedId}`);
      
      // Verify the document was inserted
      const found = await testCollection.findOne({ _id: result.insertedId });
      console.log(`✅ Retrieved test document:`, {
        testType: found.testType,
        classes: found.classes,
        status: found.status
      });
      
      // Test ID generation
      const testId = await dbManager.generateTestId(schoolCode);
      console.log(`✅ Generated test ID: ${testId}`);
      
      console.log(`✅ School ${schoolCode} database test completed\n`);
    }
    
    console.log('🎉 All multi-tenant database tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await dbManager.closeAllConnections();
  }
}

// Run the test
testMultiTenantDatabase();
