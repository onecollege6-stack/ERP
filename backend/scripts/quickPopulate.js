require('dotenv').config();
const mongoose = require('mongoose');
const SchoolDatabaseManager = require('../utils/databaseManager');

// Quick database population script
async function quickPopulate() {
  try {
    console.log('🚀 Quick Database Population Script');
    console.log('=====================================');
    
    const schoolCode = 'DEMO001';
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    console.log('🔗 Connecting to MongoDB...');
    console.log(`📍 URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // Hide credentials in log
    
    // Connect to MongoDB using the URI from .env
    await mongoose.connect(mongoUri);
    
    // Initialize database connection
    await SchoolDatabaseManager.initialize();
    const connection = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    
    console.log('✅ Connected to database');
    
    // Sample student data structure
    const classes = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const sections = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    let totalCreated = 0;
    
    // Create sample students directly in database
    for (let i = 0; i < classes.length; i++) {
      const className = classes[i];
      
      for (let j = 0; j < sections.length; j++) {
        const section = sections[j];
        
        // Create 10 students per section
        for (let k = 1; k <= 10; k++) {
          const studentData = {
            userId: `${schoolCode}-S-${String(totalCreated + 1).padStart(4, '0')}`,
            name: {
              firstName: `Student${k}`,
              lastName: `Class${className}${section}`,
              displayName: `Student${k} Class${className}${section}`
            },
            email: `student${k}.class${className}${section.toLowerCase()}@demo.com`,
            password: '$2a$10$defaulthashedpassword', // Default hashed password
            role: 'student',
            contact: {
              primaryPhone: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`
            },
            address: {
              permanent: {
                street: `Address ${k}`,
                city: 'Bangalore',
                state: 'Karnataka',
                country: 'India',
                pincode: '560001'
              }
            },
            schoolCode: schoolCode,
            studentDetails: {
              studentId: `${schoolCode}-S-${String(totalCreated + 1).padStart(4, '0')}`,
              academic: {
                currentClass: className,
                currentSection: section,
                academicYear: '2024-25',
                admissionDate: new Date()
              },
              personal: {
                dateOfBirth: new Date(2010 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                gender: Math.random() > 0.5 ? 'male' : 'female',
                nationality: 'Indian'
              }
            },
            isActive: true,
            createdAt: new Date(),
            passwordChangeRequired: false
          };
          
          await connection.collection('students').insertOne(studentData);
          totalCreated++;
        }
        
        console.log(`✅ Created 10 students for Class ${className} Section ${section}`);
      }
    }
    
    // Create sample teachers
    const subjects = ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Physical Education'];
    
    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];
      const teacherData = {
        userId: `${schoolCode}-T-${String(i + 1).padStart(4, '0')}`,
        name: {
          firstName: `Teacher`,
          lastName: subject.replace(' ', ''),
          displayName: `Teacher ${subject}`
        },
        email: `teacher.${subject.toLowerCase().replace(' ', '')}@demo.com`,
        password: '$2a$10$defaulthashedpassword',
        role: 'teacher',
        contact: {
          primaryPhone: `99${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`
        },
        address: {
          permanent: {
            street: 'Teacher Address',
            city: 'Bangalore',
            state: 'Karnataka',
            country: 'India',
            pincode: '560001'
          }
        },
        schoolCode: schoolCode,
        teacherDetails: {
          employeeId: `${schoolCode}-T-${String(i + 1).padStart(4, '0')}`,
          subjects: [{
            subjectCode: subject.toLowerCase().replace(' ', '_'),
            subjectName: subject,
            isPrimary: true
          }],
          qualification: { highest: 'B.Ed' },
          experience: { total: Math.floor(Math.random() * 10) + 2 }
        },
        isActive: true,
        createdAt: new Date(),
        passwordChangeRequired: false
      };
      
      await connection.collection('teachers').insertOne(teacherData);
      console.log(`✅ Created teacher for ${subject}`);
    }
    
    console.log('\n🎉 Database population completed!');
    console.log(`📊 Total students created: ${totalCreated}`);
    console.log(`👨‍🏫 Total teachers created: ${subjects.length}`);
    console.log(`🏫 Classes: ${classes.join(', ')}`);
    console.log(`📝 Sections per class: ${sections.join(', ')}`);
    console.log('👥 Students per section: 10');
    
    // Close connection
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
quickPopulate();
