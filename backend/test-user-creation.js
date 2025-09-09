const SchoolDatabaseManager = require('./utils/schoolDatabaseManager');
const UserGenerator = require('./utils/userGenerator');

async function testUserCreation() {
  try {
    console.log('Testing user creation in school_p database...');
    
    // Test creating an admin user
    const adminUserData = {
      firstName: 'Test',
      lastName: 'Admin',
      email: 'test.admin@school-p.com',
      role: 'admin',
      phone: '1234567890'
    };
    
    console.log('Creating admin user...');
    const adminResult = await UserGenerator.createUser('p', adminUserData);
    console.log('Admin created successfully:', {
      userId: adminResult.user.userId,
      email: adminResult.user.email,
      credentials: adminResult.credentials
    });
    
    // Test creating a teacher user
    const teacherUserData = {
      firstName: 'Test',
      lastName: 'Teacher',
      email: 'test.teacher@school-p.com',
      role: 'teacher',
      phone: '1234567891',
      subjects: ['Math', 'Science'],
      classes: ['Class 10A']
    };
    
    console.log('\nCreating teacher user...');
    const teacherResult = await UserGenerator.createUser('p', teacherUserData);
    console.log('Teacher created successfully:', {
      userId: teacherResult.user.userId,
      email: teacherResult.user.email,
      credentials: teacherResult.credentials
    });
    
    // Now check users again
    console.log('\nChecking users after creation...');
    const admins = await UserGenerator.getUsersByRole('p', 'admin');
    const teachers = await UserGenerator.getUsersByRole('p', 'teacher');
    
    console.log(`Admins: ${admins.length} users`);
    console.log(`Teachers: ${teachers.length} users`);
    
    if (admins.length > 0) {
      console.log('Sample admin:', {
        userId: admins[0].userId,
        email: admins[0].email,
        name: admins[0].name
      });
    }
    
    if (teachers.length > 0) {
      console.log('Sample teacher:', {
        userId: teachers[0].userId,
        email: teachers[0].email,
        name: teachers[0].name,
        teachingInfo: teachers[0].teachingInfo
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testUserCreation();
