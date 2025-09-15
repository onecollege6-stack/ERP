const mongoose = require('mongoose');
const School = require('./models/School');

const config = {
  mongodb: {
    uri: 'mongodb+srv://nitopunk04o:IOilWo4osDam0vmN@erp.ua5qems.mongodb.net/institute_erp?retryWrites=true&w=majority&appName=erp'
  }
};

async function checkSchool() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB');

    // Check for school with code 'z'
    const schoolWithCodeZ = await School.findOne({ code: 'z' });
    console.log('School with code "z":', schoolWithCodeZ);

    // Check for school with code 'Z' (uppercase)
    const schoolWithCodeZUpper = await School.findOne({ code: 'Z' });
    console.log('School with code "Z":', schoolWithCodeZUpper);

    // List all schools
    const allSchools = await School.find({}, { code: 1, name: 1 });
    console.log('All schools:', allSchools);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchool();
