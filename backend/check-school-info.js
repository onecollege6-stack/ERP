const DatabaseManager = require('./utils/databaseManager');

async function checkSchoolInfo() {
  try {
    console.log('🔍 Checking school_info data structure...');
    await DatabaseManager.initialize();
    const schoolConnection = await DatabaseManager.getSchoolConnection('p');
    const schoolInfoCollection = schoolConnection.collection('school_info');
    const schoolInfo = await schoolInfoCollection.findOne({});

    if (schoolInfo) {
      console.log('✅ School info found:');
      console.log('Address field:', JSON.stringify(schoolInfo.address, null, 2));
      console.log('Full school info:', JSON.stringify(schoolInfo, null, 2));
    } else {
      console.log('❌ No school_info document found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkSchoolInfo();
