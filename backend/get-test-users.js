const SchoolDatabaseManager = require('./utils/schoolDatabaseManager');

async function getUsers() {
  try {
    console.log('Getting user details with passwords for testing...');
    
    const connection = await SchoolDatabaseManager.getSchoolConnection('p');
    
    // Get admin user
    const adminCollection = connection.collection('admins');
    const admin = await adminCollection.findOne({ email: 'test.admin@school-p.com' });
    
    // Get teacher user  
    const teacherCollection = connection.collection('teachers');
    const teacher = await teacherCollection.findOne({ email: 'l@l.l' });
    
    console.log('\n=== ADMIN USER ===');
    console.log('Email:', admin?.email);
    console.log('User ID:', admin?.userId);
    console.log('Password (hashed):', admin?.password);
    
    console.log('\n=== TEACHER USER ===');
    console.log('Email:', teacher?.email);
    console.log('User ID:', teacher?.userId);
    console.log('Password (hashed):', teacher?.password);
    
    // Note: We can't get the plain password since it's hashed
    // Let's create a new test user with a known password
    console.log('\n=== Creating test users with known passwords ===');
    
    const UserGenerator = require('./utils/userGenerator');
    
    // Create test admin
    try {
      const testAdmin = await UserGenerator.createUser('p', {
        firstName: 'Test',
        lastName: 'AdminLogin',
        email: 'admin@test.com',
        role: 'admin',
        phone: '1234567890'
      });
      
      console.log('\nTEST ADMIN CREATED:');
      console.log('Email:', testAdmin.user.email);
      console.log('Password:', testAdmin.credentials.password);
      console.log('User ID:', testAdmin.credentials.userId);
    } catch (err) {
      console.log('Admin creation error:', err.message);
    }
    
    // Create test teacher
    try {
      const testTeacher = await UserGenerator.createUser('p', {
        firstName: 'Test',
        lastName: 'TeacherLogin',
        email: 'teacher@test.com',
        role: 'teacher',
        phone: '1234567891'
      });
      
      console.log('\nTEST TEACHER CREATED:');
      console.log('Email:', testTeacher.user.email);
      console.log('Password:', testTeacher.credentials.password);
      console.log('User ID:', testTeacher.credentials.userId);
    } catch (err) {
      console.log('Teacher creation error:', err.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getUsers();
