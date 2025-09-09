// Seed script to add a default admin and teacher user to a test school for Manage Users UI
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://nitopunk04o:IOilWo4osDam0vmN@erp.ua5qems.mongodb.net/school_testschool?retryWrites=true&w=majority&appName=erp';

async function seedUsers() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    const connection = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const db = connection.connection.db;
    const admins = db.collection('admins');
    const teachers = db.collection('teachers');

    // Remove existing test users
    await admins.deleteMany({ email: { $in: ['admin1@testschool.edu'] } });
    await teachers.deleteMany({ email: { $in: ['teacher1@testschool.edu'] } });

    // Hash passwords
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const teacherPassword = await bcrypt.hash('Teacher@123', 10);

    // Insert admin
    await admins.insertOne({
      userId: 'TESTSCHOOL-A-0001',
      email: 'admin1@testschool.edu',
      password: adminPassword,
      role: 'admin',
      name: { firstName: 'Admin', lastName: 'One', displayName: 'Admin One' },
      contact: { primaryPhone: '9000000001' },
      schoolCode: 'TESTSCHOOL',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      adminInfo: { permissions: ['manage_users'], employeeId: 'EMP-001', joinDate: new Date(), department: 'Administration' }
    });

    // Insert teacher
    await teachers.insertOne({
      userId: 'TESTSCHOOL-T-0001',
      email: 'teacher1@testschool.edu',
      password: teacherPassword,
      role: 'teacher',
      name: { firstName: 'Teacher', lastName: 'One', displayName: 'Teacher One' },
      contact: { primaryPhone: '9000000002' },
      schoolCode: 'TESTSCHOOL',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      teachingInfo: { subjects: ['Math'], classes: ['5A'], employeeId: 'EMP-002', joinDate: new Date(), qualification: 'B.Ed', experience: 3 }
    });

    console.log('✅ Seeded admin and teacher users for TESTSCHOOL');
    await connection.disconnect();
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
