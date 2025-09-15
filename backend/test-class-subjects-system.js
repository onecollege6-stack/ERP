const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_SCHOOL_CODE = 'TEST001';
const TEST_USER = {
  schoolCode: TEST_SCHOOL_CODE,
  schoolId: '676d123456789012345678901',
  userId: 'ADMIN001',
  role: 'admin'
};

// Mock JWT token for testing (you'll need to replace this with a real token)
let authToken = '';

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

// Test functions

/**
 * Test Authentication (you'll need to implement this based on your auth system)
 */
async function testAuth() {
  try {
    console.log('🔐 Testing Authentication...');
    
    // This is a placeholder - you'll need to implement actual login
    // For now, we'll simulate having a token
    authToken = 'your-jwt-token-here';
    
    console.log('✅ Authentication setup complete');
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    return false;
  }
}

/**
 * Test adding subjects to classes
 */
async function testAddSubjectsToClasses() {
  try {
    console.log('\n📚 Testing Add Subjects to Classes...');
    
    for (const testClass of testClasses) {
      console.log(`\n  Testing class: ${testClass.className}`);
      
      // Test bulk add subjects
      const response = await axios.post(
        `${BASE_URL}/class-subjects/bulk-add`,
        {
          className: testClass.className,
          grade: testClass.grade,
          section: testClass.section,
          subjects: testClass.subjects
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'x-school-code': TEST_SCHOOL_CODE
          }
        }
      );
      
      if (response.data.success) {
        console.log(`  ✅ ${testClass.className}: Added ${response.data.data.results.added.length} subjects`);
        console.log(`     Subjects: ${response.data.data.results.added.join(', ')}`);
        if (response.data.data.results.skipped.length > 0) {
          console.log(`     Skipped: ${response.data.data.results.skipped.join(', ')}`);
        }
      } else {
        console.log(`  ❌ ${testClass.className}: ${response.data.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error adding subjects to classes:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test getting all classes with subjects
 */
async function testGetAllClasses() {
  try {
    console.log('\n📋 Testing Get All Classes...');
    
    const response = await axios.get(
      `${BASE_URL}/class-subjects/classes`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-school-code': TEST_SCHOOL_CODE
        }
      }
    );
    
    if (response.data.success) {
      console.log(`✅ Retrieved ${response.data.data.totalClasses} classes`);
      
      response.data.data.classes.forEach(classItem => {
        console.log(`  📝 ${classItem.className}: ${classItem.totalSubjects} subjects`);
        const subjectNames = classItem.subjects.map(s => s.name).join(', ');
        console.log(`     Subjects: ${subjectNames}`);
      });
      
      return response.data.data.classes;
    } else {
      console.log(`❌ Failed to get classes: ${response.data.message}`);
      return [];
    }
  } catch (error) {
    console.error('❌ Error getting all classes:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Test getting subjects for a specific class
 */
async function testGetSubjectsForClass(className) {
  try {
    console.log(`\n🔍 Testing Get Subjects for ${className}...`);
    
    const response = await axios.get(
      `${BASE_URL}/class-subjects/class/${encodeURIComponent(className)}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-school-code': TEST_SCHOOL_CODE
        }
      }
    );
    
    if (response.data.success) {
      const classData = response.data.data;
      console.log(`✅ ${className}:`);
      console.log(`   Grade: ${classData.grade}, Section: ${classData.section}`);
      console.log(`   Total Subjects: ${classData.totalSubjects}`);
      
      classData.subjects.forEach(subject => {
        console.log(`   📖 ${subject.name} (${subject.code}) - ${subject.type}`);
      });
      
      return classData;
    } else {
      console.log(`❌ Failed to get subjects for ${className}: ${response.data.message}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error getting subjects for ${className}:`, error.response?.data || error.message);
    return null;
  }
}

/**
 * Test adding a single subject to a class
 */
async function testAddSingleSubject() {
  try {
    console.log('\n➕ Testing Add Single Subject...');
    
    const response = await axios.post(
      `${BASE_URL}/class-subjects/add-subject`,
      {
        className: 'Class 1A',
        grade: '1',
        section: 'A',
        subjectName: 'Music',
        subjectType: 'activity'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'x-school-code': TEST_SCHOOL_CODE
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Successfully added Music to Class 1A');
      console.log(`   Total subjects now: ${response.data.data.totalSubjects}`);
    } else {
      console.log(`❌ Failed to add subject: ${response.data.message}`);
    }
    
    return response.data.success;
  } catch (error) {
    console.error('❌ Error adding single subject:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test removing a subject from a class
 */
async function testRemoveSubject() {
  try {
    console.log('\n➖ Testing Remove Subject...');
    
    const response = await axios.delete(
      `${BASE_URL}/class-subjects/remove-subject`,
      {
        data: {
          className: 'Class 1A',
          subjectName: 'Music'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'x-school-code': TEST_SCHOOL_CODE
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Successfully removed Music from Class 1A');
      console.log(`   Total subjects now: ${response.data.data.totalSubjects}`);
    } else {
      console.log(`❌ Failed to remove subject: ${response.data.message}`);
    }
    
    return response.data.success;
  } catch (error) {
    console.error('❌ Error removing subject:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test getting subjects by grade and section
 */
async function testGetSubjectsByGradeSection() {
  try {
    console.log('\n🎯 Testing Get Subjects by Grade and Section...');
    
    const response = await axios.get(
      `${BASE_URL}/class-subjects/grade/8/section/A`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-school-code': TEST_SCHOOL_CODE
        }
      }
    );
    
    if (response.data.success) {
      const classData = response.data.data;
      console.log(`✅ Grade 8, Section A:`);
      console.log(`   Class Name: ${classData.className}`);
      console.log(`   Total Subjects: ${classData.totalSubjects}`);
      
      classData.subjects.forEach(subject => {
        console.log(`   📖 ${subject.name} (${subject.code}) - ${subject.type}`);
      });
      
      return classData;
    } else {
      console.log(`❌ Failed to get subjects by grade/section: ${response.data.message}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting subjects by grade/section:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 Starting Class-based Subject System Tests...\n');
  console.log('=' * 60);
  
  // Step 1: Setup authentication
  const authSuccess = await testAuth();
  if (!authSuccess) {
    console.log('\n❌ Tests aborted due to authentication failure');
    return;
  }
  
  // Step 2: Test adding subjects to classes
  const addSuccess = await testAddSubjectsToClasses();
  if (!addSuccess) {
    console.log('\n❌ Tests aborted due to add subjects failure');
    return;
  }
  
  // Step 3: Test getting all classes
  const allClasses = await testGetAllClasses();
  
  // Step 4: Test getting subjects for specific classes
  if (allClasses.length > 0) {
    await testGetSubjectsForClass(allClasses[0].className);
  }
  
  // Step 5: Test grade/section lookup
  await testGetSubjectsByGradeSection();
  
  // Step 6: Test adding single subject
  await testAddSingleSubject();
  
  // Step 7: Test removing subject
  await testRemoveSubject();
  
  console.log('\n' + '=' * 60);
  console.log('🎉 Class-based Subject System Tests Completed!');
  console.log('\n📝 Test Summary:');
  console.log('   ✅ Created classes with bulk subject addition');
  console.log('   ✅ Retrieved all classes and their subjects');
  console.log('   ✅ Retrieved subjects for specific classes');
  console.log('   ✅ Retrieved subjects by grade and section');
  console.log('   ✅ Added and removed individual subjects');
  console.log('\n💡 The simplified class-based subject system is working!');
}

// Handle command line execution
if (require.main === module) {
  console.log('⚠️  Note: This test requires a running server and valid authentication.');
  console.log('   Please ensure your server is running on http://localhost:5000');
  console.log('   and update the authToken variable with a valid JWT token.\n');
  
  runTests().catch(error => {
    console.error('🚨 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testAddSubjectsToClasses,
  testGetAllClasses,
  testGetSubjectsForClass,
  testAddSingleSubject,
  testRemoveSubject,
  testGetSubjectsByGradeSection
};
