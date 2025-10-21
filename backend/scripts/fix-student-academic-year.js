/**
 * ONE-TIME MIGRATION SCRIPT
 * This script adds academicYear field to all existing students
 * Run this once: node scripts/fix-student-academic-year.js
 */

const mongoose = require('mongoose');
const DatabaseManager = require('../utils/databaseManager');
const School = require('../models/School');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/institute_erp';

async function fixStudentAcademicYear() {
  try {
    console.log('🔧 Starting Student Academic Year Migration...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Initialize Database Manager
    await DatabaseManager.initialize();
    console.log('✅ Database Manager initialized\n');

    // Get all schools
    const schools = await School.find({ isActive: true });
    console.log(`📊 Found ${schools.length} active school(s)\n`);

    let totalUpdated = 0;

    for (const school of schools) {
      console.log(`\n🏫 Processing school: ${school.name} (${school.code})`);

      // Get current academic year from school settings or use default
      const currentAcademicYear = school.settings?.academicYear?.currentYear || '2024-2025';
      console.log(`   Academic Year: ${currentAcademicYear}`);

      // Get school database connection
      const schoolConnection = await DatabaseManager.getSchoolConnection(school.code);
      const usersCollection = schoolConnection.collection('users');

      // Find students without academic year
      const studentsToUpdate = await usersCollection.find({
        role: 'student',
        isActive: true,
        $or: [
          { 'studentDetails.academic.academicYear': { $exists: false } },
          { 'studentDetails.academic.academicYear': null },
          { 'studentDetails.academic.academicYear': '' }
        ]
      }).toArray();

      console.log(`   Students without academic year: ${studentsToUpdate.length}`);

      if (studentsToUpdate.length > 0) {
        // Update all students
        const result = await usersCollection.updateMany(
          {
            role: 'student',
            isActive: true,
            $or: [
              { 'studentDetails.academic.academicYear': { $exists: false } },
              { 'studentDetails.academic.academicYear': null },
              { 'studentDetails.academic.academicYear': '' }
            ]
          },
          {
            $set: {
              'studentDetails.academic.academicYear': currentAcademicYear,
              updatedAt: new Date()
            }
          }
        );

        console.log(`   ✅ Updated ${result.modifiedCount} students`);
        totalUpdated += result.modifiedCount;
      } else {
        console.log(`   ✅ All students already have academic year`);
      }
    }

    console.log(`\n\n🎉 Migration Complete!`);
    console.log(`📊 Total students updated: ${totalUpdated}`);
    console.log(`\n✅ All students now have academic year field`);
    console.log(`✅ Promotion system is ready to use!\n`);

    // Close connections
    await DatabaseManager.closeAllConnections();
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixStudentAcademicYear();
