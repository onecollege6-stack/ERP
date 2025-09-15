const mongoose = require('mongoose');
const config = require('./config/config');
const ModelFactory = require('./utils/modelFactory');

async function testSubjectSaving() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');

    const schoolCode = 'z';
    
    // Get the school-specific Subject model
    const SchoolSubject = await ModelFactory.getSubjectModel(schoolCode);
    
    // Check if any subjects exist for school z
    const existingSubjects = await SchoolSubject.find({ schoolCode });
    console.log(`📊 Found ${existingSubjects.length} existing subjects for school ${schoolCode}`);
    
    if (existingSubjects.length > 0) {
      console.log('📝 Sample subjects:');
      existingSubjects.slice(0, 3).forEach((subject, index) => {
        console.log(`  ${index + 1}. ${subject.subjectName} (${subject.subjectCode}) - Class: ${subject.className}`);
      });
    }

    // Test saving a sample subject
    const testSubject = {
      subjectId: `${schoolCode}-TEST-2024-25`,
      subjectName: 'Test Subject',
      subjectCode: 'TEST',
      className: 'Grade 1',
      description: 'Test subject for verification',
      isActive: true,
      schoolId: schoolCode,
      schoolCode: schoolCode,
      academicYear: '2024-25',
      subjectType: 'academic',
      category: 'core',
      applicableGrades: [{
        grade: 'Grade 1',
        isCompulsory: true,
        maxMarks: 100,
        passMarks: 40
      }],
      createdBy: 'test-user'
    };

    // Save test subject
    const savedSubject = await SchoolSubject.create(testSubject);
    console.log(`✅ Successfully saved test subject: ${savedSubject.subjectName}`);

    // Verify it was saved in the correct database
    const verification = await SchoolSubject.findOne({ subjectCode: 'TEST', schoolCode });
    if (verification) {
      console.log(`✅ Verification successful: Subject found in school_${schoolCode} database`);
      console.log(`📍 Database: ${SchoolSubject.db.name}`);
      console.log(`📍 Collection: ${SchoolSubject.collection.name}`);
    }

    // Clean up test subject
    await SchoolSubject.deleteOne({ subjectCode: 'TEST', schoolCode });
    console.log('🧹 Cleaned up test subject');

  } catch (error) {
    console.error('❌ Error testing subject saving:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📪 Disconnected from MongoDB');
  }
}

// Run the test
testSubjectSaving();
