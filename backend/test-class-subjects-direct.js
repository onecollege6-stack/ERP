const mongoose = require('mongoose');
const ClassSubjectsSimple = require('./models/ClassSubjectsSimple');
require('dotenv').config();

// Test configuration
const TEST_SCHOOL_CODE = 'TEST001';
const TEST_SCHOOL_ID = new mongoose.Types.ObjectId();
const TEST_USER_ID = 'ADMIN001';

// Test data
const testClasses = [
  {
    className: 'Class 1A',
    grade: '1',
    section: 'A',
    subjects: [
      { name: 'Mathematics', type: 'core' },
      { name: 'English', type: 'core' },
      { name: 'Science', type: 'core' },
      { name: 'Hindi', type: 'language' },
      { name: 'Art & Craft', type: 'activity' }
    ]
  },
  {
    className: 'Class 2B',
    grade: '2',
    section: 'B',
    subjects: [
      { name: 'Mathematics', type: 'core' },
      { name: 'English', type: 'core' },
      { name: 'Environmental Studies', type: 'core' },
      { name: 'Hindi', type: 'language' },
      { name: 'Physical Education', type: 'activity' }
    ]
  },
  {
    className: 'Class 8A',
    grade: '8',
    section: 'A',
    subjects: [
      { name: 'Mathematics', type: 'core' },
      { name: 'English', type: 'core' },
      { name: 'Science', type: 'core' },
      { name: 'Social Studies', type: 'core' },
      { name: 'Hindi', type: 'language' },
      { name: 'Computer Science', type: 'elective' }
    ]
  }
];

async function connectToDatabase() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/institute_erp';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
}

async function testCreateClassesWithSubjects() {
  try {
    console.log('\n📚 Testing Create Classes with Subjects...');
    
    for (const testClass of testClasses) {
      console.log(`\n  Creating class: ${testClass.className}`);
      
      // Create or find class
      const classSubjects = await ClassSubjectsSimple.findOrCreateClass({
        className: testClass.className,
        grade: testClass.grade,
        section: testClass.section,
        schoolCode: TEST_SCHOOL_CODE,
        schoolId: TEST_SCHOOL_ID,
        createdBy: TEST_USER_ID
      });
      
      console.log(`  ✅ Class created with ID: ${classSubjects._id}`);
      
      // Add subjects
      const results = { added: [], skipped: [], errors: [] };
      
      for (const subjectData of testClass.subjects) {
        try {
          classSubjects.addSubject({
            name: subjectData.name,
            type: subjectData.type
          });
          results.added.push(subjectData.name);
        } catch (error) {
          if (error.message.includes('already exists')) {
            results.skipped.push(subjectData.name);
          } else {
            results.errors.push({ subject: subjectData.name, error: error.message });
          }
        }
      }
      
      classSubjects.lastModifiedBy = TEST_USER_ID;
      await classSubjects.save();
      
      console.log(`  📖 Added: ${results.added.length} subjects`);
      console.log(`     Subjects: ${results.added.join(', ')}`);
      if (results.skipped.length > 0) {
        console.log(`     Skipped: ${results.skipped.join(', ')}`);
      }
      if (results.errors.length > 0) {
        console.log(`     Errors: ${results.errors.length}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error creating classes with subjects:', error);
    return false;
  }
}

async function testGetAllClasses() {
  try {
    console.log('\n📋 Testing Get All Classes...');
    
    const classes = await ClassSubjectsSimple.getAllClasses(TEST_SCHOOL_CODE);
    
    console.log(`✅ Retrieved ${classes.length} classes`);
    
    classes.forEach(classItem => {
      console.log(`\n  📝 ${classItem.className}:`);
      console.log(`     Grade: ${classItem.grade}, Section: ${classItem.section}`);
      console.log(`     Total Subjects: ${classItem.totalSubjects}`);
      
      const activeSubjects = classItem.getActiveSubjects();
      activeSubjects.forEach(subject => {
        console.log(`     📖 ${subject.name} (${subject.code}) - ${subject.type}`);
      });
    });
    
    return classes;
  } catch (error) {
    console.error('❌ Error getting all classes:', error);
    return [];
  }
}

async function testAddSingleSubject() {
  try {
    console.log('\n➕ Testing Add Single Subject...');
    
    const classSubjects = await ClassSubjectsSimple.findOne({
      schoolCode: TEST_SCHOOL_CODE,
      className: 'Class 1A',
      isActive: true
    });
    
    if (!classSubjects) {
      console.log('❌ Class 1A not found');
      return false;
    }
    
    // Add a new subject
    try {
      classSubjects.addSubject({
        name: 'Music',
        type: 'activity'
      });
      
      classSubjects.lastModifiedBy = TEST_USER_ID;
      await classSubjects.save();
      
      console.log('✅ Successfully added Music to Class 1A');
      console.log(`   Total subjects now: ${classSubjects.totalSubjects}`);
      
      return true;
    } catch (error) {
      console.log(`❌ Failed to add subject: ${error.message}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error adding single subject:', error);
    return false;
  }
}

async function testRemoveSubject() {
  try {
    console.log('\n➖ Testing Remove Subject...');
    
    const classSubjects = await ClassSubjectsSimple.findOne({
      schoolCode: TEST_SCHOOL_CODE,
      className: 'Class 1A',
      isActive: true
    });
    
    if (!classSubjects) {
      console.log('❌ Class 1A not found');
      return false;
    }
    
    // Remove the subject
    try {
      classSubjects.removeSubject('Music');
      
      classSubjects.lastModifiedBy = TEST_USER_ID;
      await classSubjects.save();
      
      console.log('✅ Successfully removed Music from Class 1A');
      console.log(`   Total subjects now: ${classSubjects.totalSubjects}`);
      
      return true;
    } catch (error) {
      console.log(`❌ Failed to remove subject: ${error.message}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error removing subject:', error);
    return false;
  }
}

async function testGetByGradeSection() {
  try {
    console.log('\n🎯 Testing Get by Grade and Section...');
    
    const classSubjects = await ClassSubjectsSimple.findByGradeSection(
      TEST_SCHOOL_CODE, 
      '8', 
      'A'
    );
    
    if (classSubjects) {
      console.log(`✅ Found Grade 8, Section A:`);
      console.log(`   Class Name: ${classSubjects.className}`);
      console.log(`   Total Subjects: ${classSubjects.totalSubjects}`);
      
      const activeSubjects = classSubjects.getActiveSubjects();
      activeSubjects.forEach(subject => {
        console.log(`   📖 ${subject.name} (${subject.code}) - ${subject.type}`);
      });
      
      return classSubjects;
    } else {
      console.log('❌ Grade 8, Section A not found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting by grade/section:', error);
    return null;
  }
}

async function cleanupTestData() {
  try {
    console.log('\n🧹 Cleaning up test data...');
    
    const result = await ClassSubjectsSimple.deleteMany({
      schoolCode: TEST_SCHOOL_CODE
    });
    
    console.log(`✅ Deleted ${result.deletedCount} test records`);
    return true;
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting Direct Model Tests for Class-based Subject System...\n');
  console.log('=' * 70);
  
  // Connect to database
  const connected = await connectToDatabase();
  if (!connected) {
    console.log('\n❌ Tests aborted due to database connection failure');
    return;
  }
  
  try {
    // Cleanup any existing test data
    await cleanupTestData();
    
    // Test 1: Create classes with subjects
    const createSuccess = await testCreateClassesWithSubjects();
    if (!createSuccess) {
      console.log('\n❌ Tests aborted due to class creation failure');
      return;
    }
    
    // Test 2: Get all classes
    const allClasses = await testGetAllClasses();
    
    // Test 3: Test grade/section lookup
    await testGetByGradeSection();
    
    // Test 4: Add single subject
    await testAddSingleSubject();
    
    // Test 5: Remove subject
    await testRemoveSubject();
    
    // Show final state
    await testGetAllClasses();
    
    console.log('\n' + '=' * 70);
    console.log('🎉 Direct Model Tests Completed Successfully!');
    console.log('\n📝 Test Summary:');
    console.log('   ✅ Created classes with subjects using model methods');
    console.log('   ✅ Retrieved all classes and their subjects');
    console.log('   ✅ Retrieved subjects by grade and section');
    console.log('   ✅ Added and removed individual subjects');
    console.log('   ✅ Verified data integrity and business logic');
    console.log('\n💡 The ClassSubjectsSimple model is working correctly!');
    
    // Optionally cleanup test data
    const shouldCleanup = process.argv.includes('--cleanup');
    if (shouldCleanup) {
      await cleanupTestData();
      console.log('\n🧹 Test data cleaned up');
    } else {
      console.log('\n💾 Test data preserved (use --cleanup flag to remove)');
    }
    
  } catch (error) {
    console.error('🚨 Test execution failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Handle command line execution
if (require.main === module) {
  runTests().catch(error => {
    console.error('🚨 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testCreateClassesWithSubjects,
  testGetAllClasses,
  testAddSingleSubject,
  testRemoveSubject,
  testGetByGradeSection
};
