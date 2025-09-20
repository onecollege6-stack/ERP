/**
 * Test script for Subject Management in Superadmin Panel
 * Run this script to test the subject management API endpoints
 */
const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
let authToken = '';
let schoolId = '';

// Helper function to get a superadmin token
async function getSuperadminToken() {
  try {
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: process.env.SUPERADMIN_EMAIL || 'superadmin@test.com',
      password: process.env.SUPERADMIN_PASSWORD || 'password123'
    });
    
    return loginResponse.data.token;
  } catch (error) {
    console.error('Error getting superadmin token:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    throw error;
  }
}

// Test function for subject management
async function testSubjectManagement() {
  try {
    const token = await getSuperadminToken();
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log('🧪 Starting Subject Management Test...\n');
    
    // Get a school ID to test with
    console.log('1. Getting school list...');
    const schoolsResponse = await axios.get(`${API_URL}/superadmin/schools`, config);
    
    if (!schoolsResponse.data.schools || schoolsResponse.data.schools.length === 0) {
      throw new Error('No schools found. Please create a school first.');
    }
    
    schoolId = schoolsResponse.data.schools[0]._id;
    console.log(`✅ Using school: ${schoolsResponse.data.schools[0].name} (ID: ${schoolId})\n`);
    
    // 2. Get all subjects for the school organized by class
    console.log('2. Getting all subjects organized by class...');
    const allSubjectsResponse = await axios.get(
      `${API_URL}/superadmin/subjects/schools/${schoolId}/subjects`,
      config
    );
    
    console.log('✅ Retrieved subjects by class');
    console.log(`School: ${allSubjectsResponse.data.data.schoolName}`);
    
    const subjectsByClass = allSubjectsResponse.data.data.subjectsByClass;
    Object.keys(subjectsByClass).forEach(className => {
      const subjectCount = subjectsByClass[className].length;
      console.log(`- Class ${className}: ${subjectCount} subjects`);
    });
    console.log();
    
    // 3. Get subjects for a specific class (Class 5)
    const testClass = '5';
    console.log(`3. Getting subjects for Class ${testClass}...`);
    const classSubjectsResponse = await axios.get(
      `${API_URL}/superadmin/subjects/schools/${schoolId}/subjects/class/${testClass}`,
      config
    );
    
    console.log(`✅ Retrieved ${classSubjectsResponse.data.data.totalSubjects} subjects for Class ${testClass}`);
    classSubjectsResponse.data.data.subjects.forEach(subject => {
      console.log(`- ${subject.subjectName} (${subject.subjectCode}): ${subject.category}, Core: ${subject.isCore}`);
    });
    console.log();
    
    // 4. Add a new subject to Class 5
    console.log(`4. Adding a new subject to Class ${testClass}...`);
    const newSubject = {
      subjectData: {
        subjectName: 'Environmental Studies',
        subjectCode: 'ENV',
        subjectType: 'academic',
        category: 'core',
        isCore: true,
        isOptional: false,
        totalMarks: 100,
        passingMarks: 35,
        theoryMarks: 80,
        practicalMarks: 20,
        hasPractical: true,
        hasProject: false,
        description: 'Study of environment and nature',
        academicYear: '2024-25'
      }
    };
    
    const addSubjectResponse = await axios.post(
      `${API_URL}/superadmin/subjects/schools/${schoolId}/subjects/class/${testClass}`,
      newSubject,
      config
    );
    
    console.log(`✅ Added subject: ${addSubjectResponse.data.data.subject.subjectName}`);
    console.log(`Subject ID: ${addSubjectResponse.data.data.subject.subjectId}`);
    const addedSubjectId = addSubjectResponse.data.data.subject._id;
    console.log();
    
    // 5. Update the subject we just added
    console.log(`5. Updating the added subject...`);
    const updateData = {
      subjectData: {
        subjectName: 'Environmental Science',
        description: 'Updated description: Comprehensive study of environment and ecology',
        academicDetails: {
          totalMarks: 100,
          passingMarks: 40,
          theoryMarks: 70,
          practicalMarks: 30
        }
      }
    };
    
    const updateSubjectResponse = await axios.put(
      `${API_URL}/superadmin/subjects/schools/${schoolId}/subjects/class/${testClass}/subject/${addedSubjectId}`,
      updateData,
      config
    );
    
    console.log(`✅ Updated subject: ${updateSubjectResponse.data.data.subject.subjectName}`);
    console.log();
    
    // 6. Get updated subjects for the class to verify
    console.log(`6. Verifying updated subjects for Class ${testClass}...`);
    const updatedClassSubjectsResponse = await axios.get(
      `${API_URL}/superadmin/subjects/schools/${schoolId}/subjects/class/${testClass}`,
      config
    );
    
    console.log(`✅ Verified: ${updatedClassSubjectsResponse.data.data.totalSubjects} subjects in Class ${testClass}`);
    const envSubject = updatedClassSubjectsResponse.data.data.subjects.find(s => s.subjectCode === 'ENV');
    if (envSubject) {
      console.log(`- Found updated subject: ${envSubject.subjectName}`);
      console.log(`- Total marks: ${envSubject.academicDetails.totalMarks}`);
      console.log(`- Passing marks: ${envSubject.academicDetails.passingMarks}`);
    }
    console.log();
    
    // 7. Add the same subject to another class (Class 6)
    const anotherClass = '6';
    console.log(`7. Adding Environmental Science to Class ${anotherClass}...`);
    
    const anotherClassSubject = {
      subjectData: {
        subjectName: 'Environmental Science',
        subjectCode: 'ENV6',
        subjectType: 'academic',
        category: 'elective',
        isCore: false,
        isOptional: true,
        totalMarks: 50,
        passingMarks: 20,
        theoryMarks: 40,
        practicalMarks: 10,
        hasPractical: true,
        description: 'Basic environmental awareness for Class 6',
        academicYear: '2024-25'
      }
    };
    
    const addToAnotherClassResponse = await axios.post(
      `${API_URL}/superadmin/subjects/schools/${schoolId}/subjects/class/${anotherClass}`,
      anotherClassSubject,
      config
    );
    
    console.log(`✅ Added Environmental Science to Class ${anotherClass}`);
    const anotherSubjectId = addToAnotherClassResponse.data.data.subject._id;
    console.log();
    
    // 8. Remove the subject from Class 5
    console.log(`8. Removing Environmental Science from Class ${testClass}...`);
    const removeSubjectResponse = await axios.delete(
      `${API_URL}/superadmin/subjects/schools/${schoolId}/subjects/class/${testClass}/subject/${addedSubjectId}`,
      config
    );
    
    console.log(`✅ Removed Environmental Science from Class ${testClass}`);
    console.log();
    
    // 9. Remove the subject from Class 6
    console.log(`9. Removing Environmental Science from Class ${anotherClass}...`);
    const removeFromAnotherClassResponse = await axios.delete(
      `${API_URL}/superadmin/subjects/schools/${schoolId}/subjects/class/${anotherClass}/subject/${anotherSubjectId}`,
      config
    );
    
    console.log(`✅ Removed Environmental Science from Class ${anotherClass}`);
    console.log();
    
    // 10. Final verification - get all subjects again
    console.log('10. Final verification - getting all subjects...');
    const finalSubjectsResponse = await axios.get(
      `${API_URL}/superadmin/subjects/schools/${schoolId}/subjects`,
      config
    );
    
    const finalSubjectsByClass = finalSubjectsResponse.data.data.subjectsByClass;
    console.log('✅ Final subject count by class:');
    Object.keys(finalSubjectsByClass).forEach(className => {
      const subjectCount = finalSubjectsByClass[className].length;
      console.log(`- Class ${className}: ${subjectCount} subjects`);
    });
    
    console.log('\n🎉 All subject management tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Subject management test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

// Run the tests
testSubjectManagement();
