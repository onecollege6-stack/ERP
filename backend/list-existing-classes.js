const mongoose = require('mongoose');
const ClassSubjectsSimple = require('./models/ClassSubjectsSimple');
const DatabaseManager = require('./utils/databaseManager');
require('dotenv').config();

async function listExistingClasses() {
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

    // List all classes
    const allClasses = await SchoolClassSubjects.find({
      schoolCode: schoolCode,
      academicYear: '2024-25',
      isActive: true
    }).select('className grade section subjects');

    console.log('\n📚 Existing classes in school_z database:');
    console.log('==========================================');
    
    if (allClasses.length === 0) {
      console.log('❌ No classes found');
    } else {
      allClasses.forEach(classData => {
        const activeSubjects = classData.subjects.filter(s => s.isActive).length;
        console.log(`📖 Class: ${classData.className} | Grade: ${classData.grade} | Section: ${classData.section} | Subjects: ${activeSubjects}`);
        
        if (classData.subjects && classData.subjects.length > 0) {
          console.log(`   Subjects: ${classData.subjects.filter(s => s.isActive).map(s => s.name).join(', ')}`);
        }
      });
    }
    
    console.log('==========================================\n');
    
  } catch (error) {
    console.error('❌ Error listing classes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

listExistingClasses();
