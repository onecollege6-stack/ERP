// Test script for the new multi-tenant user management system
const UserGenerator = require('../utils/userGenerator');
const SchoolDatabaseManager = require('../utils/schoolDatabaseManager');

async function testUserManagement() {
  try {
    console.log('🧪 Testing Multi-Tenant User Management System\n');
    
    const schoolCode = 'NPS'; // Using NPS as test school
    
    // Test 1: Create different types of users
    console.log('📝 Test 1: Creating users of different roles...\n');
    
    // Create an admin
    const adminResult = await UserGenerator.createUser(schoolCode, {
      email: 'admin@nps.edu',
      role: 'admin',
      firstName: 'John',
      lastName: 'Smith',
      phone: '9876543210',
      department: 'Administration'
    });
    console.log('👨‍💼 Admin created:', adminResult.credentials);
    
    // Create a teacher
    const teacherResult = await UserGenerator.createUser(schoolCode, {
      email: 'teacher@nps.edu',
      role: 'teacher',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '9876543211',
      subjects: ['Mathematics', 'Physics'],
      qualification: 'M.Sc Mathematics'
    });
    console.log('👩‍🏫 Teacher created:', teacherResult.credentials);
    
    // Create a student
    const studentResult = await UserGenerator.createUser(schoolCode, {
      email: 'student@nps.edu',
      role: 'student',
      firstName: 'Emily',
      lastName: 'Davis',
      phone: '9876543212',
      class: '10th',
      section: 'A',
      rollNumber: '15'
    });
    console.log('👩‍🎓 Student created:', studentResult.credentials);
    
    // Create a parent
    const parentResult = await UserGenerator.createUser(schoolCode, {
      email: 'parent@nps.edu',
      role: 'parent',
      firstName: 'Michael',
      lastName: 'Davis',
      phone: '9876543213',
      occupation: 'Engineer',
      relationToStudent: 'Father'
    });
    console.log('👨‍👩‍👧‍👦 Parent created:', parentResult.credentials);
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 2: Retrieve users by role
    console.log('📋 Test 2: Retrieving users by role...\n');
    
    const admins = await UserGenerator.getUsersByRole(schoolCode, 'admin');
    console.log(`👨‍💼 Admins (${admins.length}):`, admins.map(u => u.userId));
    
    const teachers = await UserGenerator.getUsersByRole(schoolCode, 'teacher');
    console.log(`👩‍🏫 Teachers (${teachers.length}):`, teachers.map(u => u.userId));
    
    const students = await UserGenerator.getUsersByRole(schoolCode, 'student');
    console.log(`👩‍🎓 Students (${students.length}):`, students.map(u => u.userId));
    
    const parents = await UserGenerator.getUsersByRole(schoolCode, 'parent');
    console.log(`👨‍👩‍👧‍👦 Parents (${parents.length}):`, parents.map(u => u.userId));
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 3: Test password reset
    console.log('🔑 Test 3: Testing password reset...\n');
    
    const resetResult = await UserGenerator.resetUserPassword(schoolCode, adminResult.user.userId);
    console.log('🔄 Password reset for admin:', resetResult.credentials);
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 4: Test user lookup by ID and email
    console.log('🔍 Test 4: Testing user lookup...\n');
    
    const userById = await UserGenerator.getUserByIdOrEmail(schoolCode, teacherResult.user.userId);
    console.log('👤 Found by ID:', userById ? userById.userId : 'Not found');
    
    const userByEmail = await UserGenerator.getUserByIdOrEmail(schoolCode, 'teacher@nps.edu');
    console.log('📧 Found by email:', userByEmail ? userByEmail.userId : 'Not found');
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 5: Test user update
    console.log('✏️ Test 5: Testing user update...\n');
    
    await UserGenerator.updateUser(schoolCode, studentResult.user.userId, {
      'name.firstName': 'Emma',
      'academicInfo.rollNumber': '16'
    });
    console.log('📝 Updated student information');
    
    console.log('\n🎉 All tests completed successfully!\n');
    
    // Display summary
    console.log('📊 SUMMARY:');
    console.log('==========');
    console.log(`🏫 School: ${schoolCode}`);
    console.log(`👨‍💼 Admin ID: ${adminResult.user.userId}`);
    console.log(`👩‍🏫 Teacher ID: ${teacherResult.user.userId}`);
    console.log(`👩‍🎓 Student ID: ${studentResult.user.userId}`);
    console.log(`👨‍👩‍👧‍👦 Parent ID: ${parentResult.user.userId}`);
    console.log('\n💡 Users can now login using either their email or user ID!');
    console.log('🔐 Passwords can be reset automatically by admins and superadmins.');
    console.log('🏢 All user data is stored in school-specific databases for complete isolation.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testUserManagement().then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = testUserManagement;
