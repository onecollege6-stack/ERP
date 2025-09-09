const mongoose = require('mongoose');
const School = require('./models/School');
require('dotenv').config();

async function checkExistingSchools() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all schools
    const schools = await School.find({});
    console.log(`Found ${schools.length} schools in database:`);
    
    schools.forEach((school, index) => {
      console.log(`${index + 1}. Name: ${school.name}, Code: ${school.code}, ID: ${school._id}`);
    });

    if (schools.length === 0) {
      console.log('No schools found in database.');
    }

  } catch (error) {
    console.error('Error checking schools:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkExistingSchools();
