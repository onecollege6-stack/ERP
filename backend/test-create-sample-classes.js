const mongoose = require('mongoose');
const ClassSubjectsSimple = require('./models/ClassSubjectsSimple');
const DatabaseManager = require('./utils/databaseManager');
require('dotenv').config();

async function createSampleClasses() {
  try {
    // Connect to main database using .env configuration
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/instituteDB';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB using .env configuration');

    // Initialize DatabaseManager (it's a singleton instance)
    await DatabaseManager.initialize();

    const schoolCode = 'z'; // School code from your testing
    
    // Get school-specific connection using DatabaseManager
    const schoolConn = await DatabaseManager.getSchoolConnection(schoolCode);
    const SchoolClassSubjects = ClassSubjectsSimple.getModelForConnection(schoolConn);

    // Sample classes to create
    const sampleClasses = [
      {
        className: 'LKG',
        grade: 'LKG',
        section: 'A',
        subjects: [
          { name: 'English', isActive: true, teacherId: null, teacherName: null },
          { name: 'Mathematics', isActive: true, teacherId: null, teacherName: null },
          { name: 'Science', isActive: true, teacherId: null, teacherName: null },
          { name: 'Drawing', isActive: true, teacherId: null, teacherName: null }
        ]
      },
      {
        className: 'UKG',
        grade: 'UKG',
        section: 'A',
        subjects: [
          { name: 'English', isActive: true, teacherId: null, teacherName: null },
          { name: 'Mathematics', isActive: true, teacherId: null, teacherName: null },
          { name: 'Science', isActive: true, teacherId: null, teacherName: null },
          { name: 'Drawing', isActive: true, teacherId: null, teacherName: null },
          { name: 'Hindi', isActive: true, teacherId: null, teacherName: null }
        ]
      },
      {
        className: '1',
        grade: '1',
        section: 'A',
        subjects: [
          { name: 'English', isActive: true, teacherId: null, teacherName: null },
          { name: 'Mathematics', isActive: true, teacherId: null, teacherName: null },
          { name: 'Science', isActive: true, teacherId: null, teacherName: null },
          { name: 'Social Studies', isActive: true, teacherId: null, teacherName: null },
          { name: 'Hindi', isActive: true, teacherId: null, teacherName: null }
        ]
      },
      {
        className: '12',
        grade: '12',
        section: 'A',
        subjects: [
          { name: 'Physics', isActive: true, teacherId: null, teacherName: null },
          { name: 'Chemistry', isActive: true, teacherId: null, teacherName: null },
          { name: 'Mathematics', isActive: true, teacherId: null, teacherName: null },
          { name: 'English', isActive: true, teacherId: null, teacherName: null },
          { name: 'Computer Science', isActive: true, teacherId: null, teacherName: null }
        ]
      }
    ];

    for (const classData of sampleClasses) {
      // Check if class already exists
      const existingClass = await SchoolClassSubjects.findOne({
        schoolCode: schoolCode,
        className: classData.className,
        academicYear: '2024-25',
        isActive: true
      });

      if (existingClass) {
        console.log(`Class ${classData.className} already exists, skipping...`);
        continue;
      }

      // Create new class with subjects
      const newClass = new SchoolClassSubjects({
        className: classData.className,
        grade: classData.grade,
        section: classData.section,
        schoolCode: schoolCode,
        schoolId: new mongoose.Types.ObjectId(), // Mock school ID
        academicYear: '2024-25',
        subjects: classData.subjects,
        createdBy: 'system',
        lastModifiedBy: 'system'
      });

      await newClass.save();
      console.log(`✅ Created class ${classData.className} with ${classData.subjects.length} subjects`);
    }

    console.log('✅ Sample classes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating sample classes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createSampleClasses();
