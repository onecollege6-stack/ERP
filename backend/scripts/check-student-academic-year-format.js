/**
 * Check what academic year format students actually have
 */

const mongoose = require('mongoose');
const DatabaseManager = require('../utils/databaseManager');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/institute_erp';

async function checkAcademicYearFormat() {
  try {
    console.log('🔍 Checking Student Academic Year Format...\n');

    await mongoose.connect(MONGODB_URI);
    await DatabaseManager.initialize();

    const schoolConnection = await DatabaseManager.getSchoolConnection('SB');
    const usersCollection = schoolConnection.collection('users');

    // Get all active students
    const students = await usersCollection.find({
      role: 'student',
      isActive: true
    }).limit(5).toArray();

    console.log(`📊 Sample of ${students.length} students:\n`);

    students.forEach(s => {
      const academicYear = s.studentDetails?.academic?.academicYear;
      const currentClass = s.studentDetails?.academic?.currentClass;
      const section = s.studentDetails?.academic?.currentSection;
      
      console.log(`${s.userId}:`);
      console.log(`  Name: ${s.name?.firstName || s.name} ${s.name?.lastName || ''}`);
      console.log(`  Class: ${currentClass}-${section}`);
      console.log(`  Academic Year: "${academicYear}" (type: ${typeof academicYear})`);
      console.log(`  Has field: ${academicYear !== undefined && academicYear !== null}`);
      console.log('');
    });

    // Check different formats
    console.log('\n🔍 Checking different academic year formats:\n');

    const formats = ['2024-25', '2024-2025', '2024/25', '2024/2025'];
    
    for (const format of formats) {
      const count = await usersCollection.countDocuments({
        role: 'student',
        isActive: true,
        'studentDetails.academic.academicYear': format
      });
      console.log(`  "${format}": ${count} students`);
    }

    // Check students without academic year
    const withoutYear = await usersCollection.countDocuments({
      role: 'student',
      isActive: true,
      $or: [
        { 'studentDetails.academic.academicYear': { $exists: false } },
        { 'studentDetails.academic.academicYear': null },
        { 'studentDetails.academic.academicYear': '' }
      ]
    });

    console.log(`  No academic year: ${withoutYear} students\n`);

    await DatabaseManager.closeAllConnections();
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAcademicYearFormat();
