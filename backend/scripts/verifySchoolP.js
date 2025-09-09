require('dotenv').config();
const mongoose = require('mongoose');
const SchoolDatabaseManager = require('../utils/databaseManager');

// Verification script to show the populated data
async function verifySchoolPData() {
  try {
    console.log('🔍 Verifying School P Database Population');
    console.log('==========================================');
    
    const schoolCode = 'P';
    const mongoUri = process.env.MONGODB_URI;
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    await SchoolDatabaseManager.initialize();
    const connection = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    
    console.log('✅ Connected to school_p database');
    
    // Get collection counts
    const studentCount = await connection.collection('students').countDocuments();
    const teacherCount = await connection.collection('teachers').countDocuments();
    
    console.log(`\n📊 Collection Counts:`);
    console.log(`   Students: ${studentCount}`);
    console.log(`   Teachers: ${teacherCount}`);
    
    // Sample student data
    console.log(`\n👨‍🎓 Sample Student Data (First 3 students):`);
    const sampleStudents = await connection.collection('students').find({}).limit(3).toArray();
    
    sampleStudents.forEach((student, index) => {
      console.log(`\n📝 Student ${index + 1}:`);
      console.log(`   • User ID: ${student.userId}`);
      console.log(`   • Name: ${student.name}`);
      console.log(`   • Class: ${student.class} | Section: ${student.section}`);
      console.log(`   • Email: ${student.email}`);
      console.log(`   • Father: ${student.fatherName}`);
      console.log(`   • Mother: ${student.motherName}`);
      console.log(`   • Caste: ${student.studentCaste} | Category: ${student.socialCategory}`);
      console.log(`   • Address: ${student.address}, ${student.district}`);
      console.log(`   • Phone: ${student.fatherMobile}`);
      console.log(`   • Aadhaar: ${student.studentAadhaar}`);
    });
    
    // Sample teacher data
    console.log(`\n👨‍🏫 Sample Teacher Data (First 3 teachers):`);
    const sampleTeachers = await connection.collection('teachers').find({}).limit(3).toArray();
    
    sampleTeachers.forEach((teacher, index) => {
      console.log(`\n📚 Teacher ${index + 1}:`);
      console.log(`   • User ID: ${teacher.userId}`);
      console.log(`   • Name: ${teacher.name}`);
      console.log(`   • Subject: ${teacher.subjects.join(', ')}`);
      console.log(`   • Qualification: ${teacher.qualification}`);
      console.log(`   • Experience: ${teacher.experience} years`);
      console.log(`   • Email: ${teacher.email}`);
      console.log(`   • Department: ${teacher.department}`);
    });
    
    // Class-wise distribution
    console.log(`\n📊 Class-wise Student Distribution:`);
    const classCounts = await connection.collection('students').aggregate([
      {
        $group: {
          _id: '$class',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();
    
    classCounts.forEach(classData => {
      console.log(`   • Class ${classData._id}: ${classData.count} students`);
    });
    
    // Section-wise distribution for a sample class
    console.log(`\n📊 Section-wise Distribution for Class 1:`);
    const sectionCounts = await connection.collection('students').aggregate([
      { $match: { class: '1' } },
      {
        $group: {
          _id: '$section',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();
    
    sectionCounts.forEach(sectionData => {
      console.log(`   • Section ${sectionData._id}: ${sectionData.count} students`);
    });
    
    // Subject-wise teacher distribution
    console.log(`\n📊 Subject-wise Teacher Distribution:`);
    const subjectCounts = await connection.collection('teachers').aggregate([
      { $unwind: '$subjects' },
      {
        $group: {
          _id: '$subjects',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();
    
    subjectCounts.forEach(subjectData => {
      console.log(`   • ${subjectData._id}: ${subjectData.count} teacher(s)`);
    });
    
    // Field completeness check
    console.log(`\n✅ Data Completeness Check:`);
    const studentsWithAllFields = await connection.collection('students').find({
      name: { $exists: true, $ne: '' },
      email: { $exists: true, $ne: '' },
      fatherName: { $exists: true, $ne: '' },
      motherName: { $exists: true, $ne: '' },
      studentAadhaar: { $exists: true, $ne: '' },
      address: { $exists: true, $ne: '' }
    }).countDocuments();
    
    console.log(`   • Students with complete basic data: ${studentsWithAllFields}/${studentCount}`);
    console.log(`   • Data completeness: ${((studentsWithAllFields/studentCount) * 100).toFixed(1)}%`);
    
    await mongoose.connection.close();
    console.log('\n✅ Verification completed');
    
  } catch (error) {
    console.error('❌ Error verifying data:', error);
    process.exit(1);
  }
}

verifySchoolPData()
  .then(() => {
    console.log('🏁 Verification script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });
