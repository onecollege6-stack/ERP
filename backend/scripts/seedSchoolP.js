const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://nitopunk04o:IOilWo4osDam0vmN@erp.ua5qems.mongodb.net/?retryWrites=true&w=majority&appName=erp';
const DATABASE_NAME = 'institute_erp';

async function seedSchoolP() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🌱 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    
    // 1. Create main schools collection with school P
    const schoolsCollection = db.collection('schools');
    
    // Remove existing school P if it exists
    await schoolsCollection.deleteOne({ code: 'P' });
    
    // Insert school P
    const schoolP = {
      code: 'P',
      name: 'Presidency School',
      address: {
        street: '123 Education Lane',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560001',
        country: 'India'
      },
      contact: {
        phone: '+91-80-12345678',
        email: 'admin@presidencyschool.edu.in'
      },
      establishedYear: 1990,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await schoolsCollection.insertOne(schoolP);
    console.log('✅ Created school P in main schools collection');
    
    // 2. Create school-specific database
    const schoolDb = client.db('school_P');
    
    // 3. Create admin user
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const adminsCollection = schoolDb.collection('admins');
    
    await adminsCollection.deleteMany({}); // Clear existing
    await adminsCollection.insertOne({
      userId: 'P-A-0001',
      email: 'admin@presidencyschool.edu.in',
      password: adminPassword,
      role: 'admin',
      name: { 
        firstName: 'School', 
        lastName: 'Admin', 
        displayName: 'School Admin' 
      },
      contact: { 
        primaryPhone: '9999999999',
        email: 'admin@presidencyschool.edu.in'
      },
      schoolCode: 'P',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      adminInfo: { 
        permissions: ['manage_users', 'manage_school'], 
        employeeId: 'P-A-0001', 
        joinDate: new Date(), 
        department: 'Administration' 
      }
    });
    console.log('✅ Created admin user P-A-0001');
    
    // 4. Create sample teacher
    const teacherPassword = await bcrypt.hash('Teacher@123', 10);
    const teachersCollection = schoolDb.collection('teachers');
    
    await teachersCollection.deleteMany({}); // Clear existing
    await teachersCollection.insertOne({
      userId: 'P-T-0001',
      email: 'teacher@presidencyschool.edu.in',
      password: teacherPassword,
      role: 'teacher',
      name: { 
        firstName: 'Math', 
        lastName: 'Teacher', 
        displayName: 'Math Teacher' 
      },
      contact: { 
        primaryPhone: '9876543210',
        email: 'teacher@presidencyschool.edu.in'
      },
      schoolCode: 'P',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      teacherInfo: {
        employeeId: 'P-T-0001',
        subjects: ['Mathematics', 'Physics'],
        qualification: 'M.Sc Mathematics',
        experience: 5,
        joinDate: new Date(),
        department: 'Science'
      }
    });
    console.log('✅ Created teacher user P-T-0001');
    
    // 5. Create sample student
    const studentPassword = await bcrypt.hash('Student@123', 10);
    const studentsCollection = schoolDb.collection('students');
    
    await studentsCollection.deleteMany({}); // Clear existing
    await studentsCollection.insertOne({
      userId: 'P-S-0001',
      email: 'student@presidencyschool.edu.in',
      password: studentPassword,
      role: 'student',
      name: { 
        firstName: 'John', 
        lastName: 'Doe', 
        displayName: 'John Doe' 
      },
      contact: { 
        primaryPhone: '9876543211',
        email: 'student@presidencyschool.edu.in'
      },
      schoolCode: 'P',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      studentInfo: {
        studentId: 'P-S-0001',
        class: '10',
        section: 'A',
        rollNumber: 1,
        admissionDate: new Date(),
        academicYear: '2024-25'
      }
    });
    console.log('✅ Created student user P-S-0001');
    
    // 6. Create ID sequences collection
    const sequencesCollection = schoolDb.collection('id_sequences');
    await sequencesCollection.deleteMany({}); // Clear existing
    
    await sequencesCollection.insertMany([
      { _id: 'admin_sequence', value: 1 },
      { _id: 'teacher_sequence', value: 1 },
      { _id: 'student_sequence', value: 1 },
      { _id: 'parent_sequence', value: 0 }
    ]);
    console.log('✅ Created ID sequences');
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@presidencyschool.edu.in / Admin@123');
    console.log('Teacher: teacher@presidencyschool.edu.in / Teacher@123');
    console.log('Student: student@presidencyschool.edu.in / Student@123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedSchoolP();
