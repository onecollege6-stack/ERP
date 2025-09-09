const databaseManager = require('./utils/databaseManager');

async function findSchoolId() {
  try {
    console.log('Finding school ID for code "p"...');
    
    await databaseManager.initialize();
    
    const School = require('./models/School');
    const school = await School.findOne({ code: 'p' });
    
    if (school) {
      console.log('School found:');
      console.log('ID:', school._id);
      console.log('Name:', school.name);
      console.log('Code:', school.code);
    } else {
      console.log('School with code "p" not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findSchoolId();
