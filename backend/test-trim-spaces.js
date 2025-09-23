const axios = require('axios');
const mongoose = require('mongoose');
const School = require('./models/School');

// Test data with spaces at the beginning and end
const testSchoolDataWithSpaces = {
  name: '   Test Trimming School   ',  // Spaces at start and end
  code: '  TTS  ',  // Spaces at start and end
  mobile: '  9876543210  ',
  principalName: '  Dr. Trim Principal  ',
  principalEmail: '  trim@testschool.com  ',
  
  address: {
    street: '  123 Trim Street  ',
    area: '  Trim Area  ',
    city: '  Trim City  ',
    district: '  Trim District  ',
    taluka: '  Trim Taluka  ',
    state: '  Karnataka  ',
    stateId: 11,
    districtId: 15,
    talukaId: 1401,
    pinCode: '  560001  '
  },
  
  contact: {
    phone: '  9876543210  ',
    email: '  contact@trimschool.com  ',
    website: '  https://trimschool.com  '
  },
  
  bankDetails: {
    bankName: '  Trim Bank  ',
    accountNumber: '  1234567890123456  ',
    ifscCode: '  trim0001234  ',  // Should be uppercased too
    branch: '  Trim Branch  ',
    accountHolderName: '  Trim School Account  '
  },
  
  schoolType: '  Private  ',
  establishedYear: '  2023  ',
  affiliationBoard: '  CBSE  ',
  website: '  https://trimschool.com  ',
  secondaryContact: '  9876543211  '
};

const API_BASE_URL = 'http://localhost:5050/api';
const SUPERADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGFiMDVhNzEwNWUwY2U1YmUwMjAyMTUiLCJyb2xlIjoic3VwZXJhZG1pbiIsImlhdCI6MTc1ODYzNTM0NywiZXhwIjoxNzU4NzIxNzQ3fQ.sFcEe4trwXqmox7C1ASK9ouiqOMvfhtyRJEeSrIYhO0';

async function testSpaceTrimming() {
  console.log('🧹 Testing Space Trimming in School Creation\n');
  
  try {
    // Step 1: Clean up any existing test school
    console.log('STEP 1: Cleanup existing test school');
    await mongoose.connect('mongodb+srv://nitopunk04o:IOilWo4osDam0vmN@erp.ua5qems.mongodb.net/institute_erp?retryWrites=true&w=majority&appName=erp');
    await School.deleteOne({ code: 'TTS' });
    console.log('✅ Cleanup completed\n');
    
    // Step 2: Create school with spaces
    console.log('STEP 2: Create school with spaces in all fields');
    console.log('📋 Original data (with spaces):');
    console.log('  name: "' + testSchoolDataWithSpaces.name + '"');
    console.log('  code: "' + testSchoolDataWithSpaces.code + '"');
    console.log('  principalName: "' + testSchoolDataWithSpaces.principalName + '"');
    console.log('  address.street: "' + testSchoolDataWithSpaces.address.street + '"');
    console.log('  bankDetails.ifscCode: "' + testSchoolDataWithSpaces.bankDetails.ifscCode + '"');
    console.log('');
    
    const response = await axios.post(`${API_BASE_URL}/schools`, testSchoolDataWithSpaces, {
      headers: {
        'Authorization': `Bearer ${SUPERADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ School created successfully');
    const schoolId = response.data.school._id;
    console.log('');
    
    // Step 3: Retrieve and verify trimming
    console.log('STEP 3: Retrieve school and verify spaces are trimmed');
    const getResponse = await axios.get(`${API_BASE_URL}/schools/${schoolId}`, {
      headers: {
        'Authorization': `Bearer ${SUPERADMIN_TOKEN}`
      }
    });
    
    const school = getResponse.data;
    console.log('📊 Trimmed data (after storage):');
    console.log('  name: "' + school.name + '"');
    console.log('  code: "' + school.code + '"');
    console.log('  principalName: "' + school.principalName + '"');
    console.log('  address.street: "' + school.address?.street + '"');
    console.log('  contact.email: "' + school.contact?.email + '"');
    console.log('  schoolType: "' + school.schoolType + '"');
    console.log('');
    
    // Step 4: Verification
    console.log('STEP 4: Trimming Verification Results');
    console.log('====================================');
    
    const checks = [
      { 
        field: 'name', 
        original: testSchoolDataWithSpaces.name, 
        trimmed: school.name,
        expected: 'Test Trimming School'
      },
      { 
        field: 'code', 
        original: testSchoolDataWithSpaces.code, 
        trimmed: school.code,
        expected: 'TTS'
      },
      { 
        field: 'principalName', 
        original: testSchoolDataWithSpaces.principalName, 
        trimmed: school.principalName,
        expected: 'Dr. Trim Principal'
      },
      { 
        field: 'address.street', 
        original: testSchoolDataWithSpaces.address.street, 
        trimmed: school.address?.street,
        expected: '123 Trim Street'
      },
      { 
        field: 'contact.email', 
        original: testSchoolDataWithSpaces.contact.email, 
        trimmed: school.contact?.email,
        expected: 'contact@trimschool.com'
      },
      { 
        field: 'schoolType', 
        original: testSchoolDataWithSpaces.schoolType, 
        trimmed: school.schoolType,
        expected: 'Private'
      }
    ];
    
    let allPassed = true;
    checks.forEach(check => {
      const passed = check.trimmed === check.expected;
      const hadSpaces = check.original !== check.original.trim();
      if (!passed) allPassed = false;
      
      console.log(`${passed ? '✅' : '❌'} ${check.field}:`);
      console.log(`    Original: "${check.original}" ${hadSpaces ? '(had spaces)' : '(no spaces)'}`);
      console.log(`    Stored:   "${check.trimmed}"`);
      console.log(`    Expected: "${check.expected}"`);
      console.log('');
    });
    
    console.log('📊 OVERALL TRIMMING TEST RESULT:');
    console.log(allPassed ? '🎉 All spaces trimmed correctly!' : '⚠️  Some fields still have spaces.');
    
    // Step 5: Cleanup
    console.log('\nSTEP 5: Cleanup');
    await School.deleteOne({ code: 'TTS' });
    console.log('✅ Test cleanup completed');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    await mongoose.disconnect();
  }
}

// Run the test
testSpaceTrimming();
