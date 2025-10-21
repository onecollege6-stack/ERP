/**
 * Check ALL users in SB school (including inactive)
 */

const mongoose = require('mongoose');
const DatabaseManager = require('../utils/databaseManager');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/institute_erp';

async function checkAllUsers() {
  try {
    console.log('🔍 Checking ALL Users in SB School...\n');

    await mongoose.connect(MONGODB_URI);
    await DatabaseManager.initialize();

    const schoolConnection = await DatabaseManager.getSchoolConnection('SB');
    const usersCollection = schoolConnection.collection('users');

    // Get total count
    const totalUsers = await usersCollection.countDocuments({});
    console.log(`📊 Total users in database: ${totalUsers}\n`);

    // Get students (all, including inactive)
    const allStudents = await usersCollection.countDocuments({ role: 'student' });
    const activeStudents = await usersCollection.countDocuments({ role: 'student', isActive: true });
    const inactiveStudents = await usersCollection.countDocuments({ role: 'student', isActive: false });

    console.log(`📊 Students:`);
    console.log(`   Total: ${allStudents}`);
    console.log(`   Active: ${activeStudents}`);
    console.log(`   Inactive: ${inactiveStudents}\n`);

    // Sample some students
    const sampleStudents = await usersCollection.find({ role: 'student' }).limit(3).toArray();

    console.log(`📋 Sample Students:\n`);
    sampleStudents.forEach(s => {
      console.log(`${s.userId}:`);
      console.log(`  Name: ${JSON.stringify(s.name)}`);
      console.log(`  Email: ${s.email}`);
      console.log(`  isActive: ${s.isActive}`);
      console.log(`  Role: ${s.role}`);
      console.log(`  studentDetails exists: ${!!s.studentDetails}`);
      if (s.studentDetails?.academic) {
        console.log(`  Class: ${s.studentDetails.academic.currentClass}`);
        console.log(`  Section: ${s.studentDetails.academic.currentSection}`);
        console.log(`  Academic Year: "${s.studentDetails.academic.academicYear}"`);
      }
      console.log('');
    });

    await DatabaseManager.closeAllConnections();
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllUsers();
