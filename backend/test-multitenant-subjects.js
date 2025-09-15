const mongoose = require('mongoose');
const config = require('./config/config');
const ModelFactory = require('./utils/modelFactory');

async function testMultiTenantSubjects() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');

    // Test with multiple schools
    const testSchools = ['z', 'ABC', 'XYZ123', 'demo-school'];
    
    for (const schoolCode of testSchools) {
      console.log(`\n🏫 Testing school: ${schoolCode}`);
      
      // Get the school-specific Subject model
      const SchoolSubject = await ModelFactory.getSubjectModel(schoolCode);
      
      // Check database and collection names
      console.log(`📍 Database: ${SchoolSubject.db.name}`);
      console.log(`📍 Collection: ${SchoolSubject.collection.name}`);
      
      // Check existing subjects
      const existingSubjects = await SchoolSubject.find({ schoolCode });
      console.log(`📊 Existing subjects: ${existingSubjects.length}`);
      
      // Test saving a sample subject
      const testSubject = {
        subjectId: `${schoolCode}-MATH-2024-25`,
        subjectName: 'Mathematics',
        subjectCode: 'MATH',
        className: 'Grade 1',
        description: 'Basic mathematics',
        isActive: true,
        schoolId: new mongoose.Types.ObjectId(), // Mock school ID
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
        createdBy: new mongoose.Types.ObjectId() // Mock user ID
      };

      try {
        // Clean existing test data
        await SchoolSubject.deleteOne({ subjectCode: 'MATH', schoolCode });
        
        // Save test subject
        const savedSubject = await SchoolSubject.create(testSubject);
        console.log(`✅ Successfully saved subject in ${schoolCode}: ${savedSubject.subjectName}`);
        
        // Verify it was saved in the correct database
        const verification = await SchoolSubject.findOne({ subjectCode: 'MATH', schoolCode });
        if (verification) {
          console.log(`✅ Verification successful for ${schoolCode}`);
        }
        
        // Clean up test subject
        await SchoolSubject.deleteOne({ subjectCode: 'MATH', schoolCode });
        console.log(`🧹 Cleaned up test subject for ${schoolCode}`);
        
      } catch (error) {
        console.error(`❌ Error testing ${schoolCode}:`, error.message);
      }
    }

    console.log('\n🎉 Multi-tenant testing completed!');

  } catch (error) {
    console.error('❌ Error in multi-tenant testing:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📪 Disconnected from MongoDB');
  }
}

// Run the test
testMultiTenantSubjects();
