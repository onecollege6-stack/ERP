/**
 * Check if students are in MAIN database instead of school database
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/institute_erp';

async function findStudents() {
  try {
    console.log('🔍 Checking MAIN Database for SB Students...\n');

    await mongoose.connect(MONGODB_URI);
    const mainDb = mongoose.connection.db;

    // Check users collection in MAIN database
    const usersCollection = mainDb.collection('users');

    const totalUsers = await usersCollection.countDocuments({});
    console.log(`📊 Total users in MAIN database: ${totalUsers}\n`);

    // Check for SB students
    const sbStudents = await usersCollection.countDocuments({
      role: 'student',
      schoolCode: 'SB'
    });

    console.log(`📊 SB Students in MAIN database: ${sbStudents}\n`);

    if (sbStudents > 0) {
      console.log('✅ FOUND STUDENTS IN MAIN DATABASE!\n');
      console.log('❌ PROBLEM: Students are in wrong database!\n');
      console.log('📋 Sample students:\n');

      const samples = await usersCollection.find({
        role: 'student',
        schoolCode: 'SB'
      }).limit(5).toArray();

      samples.forEach(s => {
        console.log(`${s.userId}:`);
        console.log(`  Name: ${JSON.stringify(s.name)}`);
        console.log(`  isActive: ${s.isActive}`);
        console.log(`  Class: ${s.studentDetails?.academic?.currentClass}`);
        console.log(`  Academic Year: "${s.studentDetails?.academic?.academicYear}"`);
        console.log('');
      });

      console.log('\n🔧 SOLUTION: Students need to be migrated to school_sb database\n');
    } else {
      console.log('❌ No SB students found in main database either\n');
    }

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findStudents();
