const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

// Import models
const SuperAdmin = require('./models/SuperAdmin');
const School = require('./models/School');

async function testSchoolCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if superadmin exists
    let superAdmin = await SuperAdmin.findOne();
    console.log('🔍 SuperAdmin found:', superAdmin ? `${superAdmin.email} (${superAdmin.role})` : 'None');

    if (!superAdmin) {
      console.log('❌ No superadmin found. Creating a test superadmin...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      superAdmin = new SuperAdmin({
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'superadmin',
        permissions: ['manage_schools', 'manage_users'],
        isActive: true
      });
      
      await superAdmin.save();
      console.log('✅ Test superadmin created: admin@test.com / admin123');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: superAdmin._id, role: 'superadmin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('🔑 Generated token for testing');

    // Test school creation via API using form data
    const FormData = require('form-data');
    const form = new FormData();
    
    // Basic school information
    form.append('name', 'Test School Academy');
    form.append('mobile', '9876543210');
    form.append('principalName', 'Dr. John Smith');
    form.append('principalEmail', 'principal@testschool.edu');
    form.append('area', 'Test Area');
    form.append('district', 'Test District');
    form.append('pinCode', '123456');
    
    // Bank details as JSON string
    form.append('bankDetails', JSON.stringify({
      bankName: 'Test Bank',
      accountNumber: '1234567890',
      ifscCode: 'TEST0001234',
      branch: 'Test Branch',
      accountHolderName: 'Test School Academy',
    }));
    
    // Access matrix as JSON string
    form.append('accessMatrix', JSON.stringify({
      admin: { manageUsers: true, manageSchoolSettings: true, viewTimetable: true, viewAttendance: true, viewResults: true, messageStudentsParents: true },
      teacher: { manageUsers: false, manageSchoolSettings: false, viewTimetable: true, viewAttendance: true, viewResults: true, messageStudentsParents: true },
      student: { manageUsers: false, manageSchoolSettings: false, viewTimetable: true, viewAttendance: true, viewResults: true, messageStudentsParents: false },
      parent: { manageUsers: false, manageSchoolSettings: false, viewTimetable: true, viewAttendance: true, viewResults: true, messageStudentsParents: false }
    }));
    
    // Additional school details
    form.append('schoolType', 'Private');
    form.append('establishedYear', '2020');
    form.append('affiliationBoard', 'CBSE');
    form.append('website', 'https://testschool.edu');
    form.append('secondaryContact', '9876543211');
    
    // Settings and features
    form.append('settings', JSON.stringify({ 
      academicYear: { 
        startDate: new Date().toISOString(), 
        endDate: new Date().toISOString(), 
        currentYear: '2024-25' 
      } 
    }));
    form.append('features', JSON.stringify({}));

    console.log('📤 Sending request to create school...');
    
    const response = await axios.post('http://localhost:5000/api/schools', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': 'Bearer test-token' // We'll need to handle auth properly
      }
    });

    console.log('✅ School creation successful!');
    console.log('📋 Response status:', response.status);
    console.log('📋 Response data:', JSON.stringify(response.data, null, 2));
    
    // Test data verification
    const createdSchool = response.data.school || response.data;
    console.log('\n🔍 Verifying stored data:');
    console.log('- School Name:', createdSchool.name);
    console.log('- School Code:', createdSchool.code);
    console.log('- Contact Phone:', createdSchool.contact?.phone);
    console.log('- Address:', `${createdSchool.address?.street}, ${createdSchool.address?.city} - ${createdSchool.address?.zipCode}`);
    console.log('- Bank Details:', createdSchool.bankDetails?.bankName);
    console.log('- School Type:', createdSchool.schoolType);
    console.log('- Established Year:', createdSchool.establishedYear);
    console.log('- Affiliation Board:', createdSchool.affiliationBoard);
    
  } catch (error) {
    console.error('❌ School creation failed:');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testSchoolCreation();
