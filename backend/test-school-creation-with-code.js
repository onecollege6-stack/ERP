const mongoose = require('mongoose');
const School = require('./models/School');
require('dotenv').config();

async function testSchoolCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Test data for school creation
    const testSchoolData = {
      name: 'Test National Public School',
      code: 'TNPS01',
      principalName: 'Test Principal',
      principalEmail: 'principal@test.com',
      contact: {
        phone: '1234567890',
        email: 'principal@test.com',
        website: 'https://test.com'
      },
      address: {
        street: 'Test Area',
        city: 'Test District',
        state: 'Test State',
        country: 'India',
        zipCode: '123456'
      },
      bankDetails: {
        bankName: 'Test Bank',
        accountNumber: '123456789',
        ifscCode: 'TEST001',
        branch: 'Test Branch',
        accountHolderName: 'Test School'
      },
      accessMatrix: {
        admin: { 
          manageUsers: true, 
          manageSchoolSettings: true, 
          viewAttendance: true, 
          viewResults: true, 
          messageStudentsParents: true 
        },
        teacher: { 
          manageUsers: false, 
          manageSchoolSettings: false, 
          viewAttendance: true, 
          viewResults: true, 
          messageStudentsParents: true 
        },
        student: { 
          manageUsers: false, 
          manageSchoolSettings: false, 
          viewAttendance: true, 
          viewResults: true, 
          messageStudentsParents: false 
        },
        parent: { 
          manageUsers: false, 
          manageSchoolSettings: false, 
          viewAttendance: true, 
          viewResults: true, 
          messageStudentsParents: false 
        }
      },
      schoolType: 'Public',
      establishedYear: 2024,
      affiliationBoard: 'CBSE',
      website: 'https://test.com',
      secondaryContact: '',
      isActive: true
    };

    // Check if school with this code already exists
    const existingSchool = await School.findOne({ code: testSchoolData.code });
    if (existingSchool) {
      console.log('School with code already exists, deleting...');
      await School.deleteOne({ code: testSchoolData.code });
    }

    // Create the school
    console.log('Creating school with data:', testSchoolData);
    const newSchool = new School(testSchoolData);
    const savedSchool = await newSchool.save();
    
    console.log('School created successfully!');
    console.log('School ID:', savedSchool._id);
    console.log('School Code:', savedSchool.code);
    console.log('School Name:', savedSchool.name);

    // Verify we can fetch it
    const fetchedSchool = await School.findOne({ code: testSchoolData.code });
    if (fetchedSchool) {
      console.log('School fetched successfully by code:', fetchedSchool.code);
    } else {
      console.log('ERROR: Could not fetch school by code');
    }

    // Clean up
    await School.deleteOne({ code: testSchoolData.code });
    console.log('Test school deleted');

  } catch (error) {
    console.error('Error in school creation test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testSchoolCreation();
