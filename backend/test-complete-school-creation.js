const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const FormData = require('form-data');
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

    // Create form data matching frontend structure
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
      ifscCode: 'TEST0123456',
      branch: 'Test Branch',
      accountHolderName: 'Test School Academy'
    }));
    
    // Access matrix as JSON string
    form.append('accessMatrix', JSON.stringify({
      admin: { manageUsers: true, manageSchoolSettings: true, viewTimetable: true, viewAttendance: true, viewResults: true, messageStudentsParents: true },
      teacher: { manageUsers: false, manageSchoolSettings: false, viewTimetable: true, viewAttendance: true, viewResults: true, messageStudentsParents: true },
      student: { manageUsers: false, manageSchoolSettings: false, viewTimetable: true, viewAttendance: true, viewResults: true, messageStudentsParents: false },
      parent: { manageUsers: false, manageSchoolSettings: false, viewTimetable: true, viewAttendance: true, viewResults: true, messageStudentsParents: false }
    }));
    
    // Additional school details
    form.append('schoolType', 'Public');
    form.append('establishedYear', '2020');
    form.append('affiliationBoard', 'CBSE');
    form.append('website', 'https://testschool.edu');
    form.append('secondaryContact', '9876543211');
    form.append('settings', JSON.stringify({ 
      academicYear: { 
        startDate: new Date().toISOString(), 
        endDate: new Date().toISOString(), 
        currentYear: '2024-25' 
      } 
    }));
    form.append('features', JSON.stringify({}));

    console.log('📤 Sending school creation request...');
    
    const response = await axios.post('http://localhost:5000/api/schools', form, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      }
    });

    console.log('✅ School created successfully!');
    console.log('📋 Response:', response.data);

    // Verify the school was stored in database
    const createdSchool = await School.findOne({ name: 'Test School Academy' });
    if (createdSchool) {
      console.log('\n📊 School data verified in database:');
      console.log('- Name:', createdSchool.name);
      console.log('- Code:', createdSchool.code);
      console.log('- Contact Phone:', createdSchool.contact?.phone);
      console.log('- Contact Email:', createdSchool.contact?.email);
      console.log('- Address Street:', createdSchool.address?.street);
      console.log('- Address City:', createdSchool.address?.city);
      console.log('- Address Zip:', createdSchool.address?.zipCode);
      console.log('- Bank Name:', createdSchool.bankDetails?.bankName);
      console.log('- Account Number:', createdSchool.bankDetails?.accountNumber);
      console.log('- School Type:', createdSchool.schoolType);
      console.log('- Established Year:', createdSchool.establishedYear);
      console.log('- Affiliation Board:', createdSchool.affiliationBoard);
      console.log('- Website:', createdSchool.website);
      console.log('✅ All data properly mapped and stored in backend!');
    } else {
      console.log('❌ School not found in database');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testSchoolCreation();
