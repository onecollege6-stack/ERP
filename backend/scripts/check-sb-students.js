/**
 * Check SB school students and their academic years
 */

const mongoose = require('mongoose');
const DatabaseManager = require('../utils/databaseManager');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/institute_erp';

async function checkSBStudents() {
  try {
    console.log('🔍 Checking SB School Students...\n');

    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');

    await DatabaseManager.initialize();
    console.log('✅ Database Manager initialized\n');

    // Get SB school database
    const schoolConnection = await DatabaseManager.getSchoolConnection('SB');
    const usersCollection = schoolConnection.collection('users');

    // Get all active students
    const allStudents = await usersCollection.find({
      role: 'student',
      isActive: true
    }).toArray();

    console.log(`📊 Total active students in SB: ${allStudents.length}\n`);

    // Group by academic year
    const byYear = {};
    const withoutYear = [];

    allStudents.forEach(student => {
      const year = student.studentDetails?.academic?.academicYear;
      if (year) {
        if (!byYear[year]) byYear[year] = [];
        byYear[year].push({
          userId: student.userId,
          name: student.name,
          class: student.studentDetails?.academic?.currentClass,
          section: student.studentDetails?.academic?.currentSection
        });
      } else {
        withoutYear.push({
          userId: student.userId,
          name: student.name,
          class: student.studentDetails?.academic?.currentClass,
          section: student.studentDetails?.academic?.currentSection
        });
      }
    });

    console.log('📊 Students by Academic Year:');
    Object.keys(byYear).forEach(year => {
      console.log(`\n   ${year}: ${byYear[year].length} students`);
      byYear[year].slice(0, 3).forEach(s => {
        console.log(`      - ${s.userId} (${s.name}) - Class ${s.class}-${s.section}`);
      });
      if (byYear[year].length > 3) {
        console.log(`      ... and ${byYear[year].length - 3} more`);
      }
    });

    if (withoutYear.length > 0) {
      console.log(`\n❌ Students WITHOUT academic year: ${withoutYear.length}`);
      withoutYear.slice(0, 5).forEach(s => {
        console.log(`   - ${s.userId} (${s.name}) - Class ${s.class}-${s.section}`);
      });
    } else {
      console.log(`\n✅ All students have academic year field`);
    }

    console.log(`\n\n🔍 Checking for students with academic year "2024-2025":`);
    const students2024 = await usersCollection.find({
      role: 'student',
      isActive: true,
      'studentDetails.academic.academicYear': '2024-2025'
    }).toArray();

    console.log(`   Found: ${students2024.length} students`);

    await DatabaseManager.closeAllConnections();
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSBStudents();
