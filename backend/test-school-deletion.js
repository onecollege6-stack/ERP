const mongoose = require('mongoose');
require('dotenv').config();

async function testSchoolDeletion() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/institute_erp';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import School model
    const School = require('./models/School');

    // List all schools before deletion
    console.log('\n📋 Schools before deletion:');
    const schoolsBefore = await School.find({}, '_id name code');
    console.table(schoolsBefore.map(s => ({ id: s._id.toString(), name: s.name, code: s.code })));

    // Try to delete a specific school (replace with an actual ID from your database)
    const schoolIdToDelete = '68c54e3f07baa407978ec794'; // Replace with actual ID
    console.log(`\n🗑️ Attempting to delete school: ${schoolIdToDelete}`);

    // Find the school first
    const schoolToDelete = await School.findById(schoolIdToDelete);
    if (!schoolToDelete) {
      console.log('❌ School not found');
      return;
    }

    console.log('📋 School found:', { id: schoolToDelete._id, name: schoolToDelete.name, code: schoolToDelete.code });

    // Delete the school
    const deletedSchool = await School.findByIdAndDelete(schoolIdToDelete);
    console.log('🗑️ Deletion result:', !!deletedSchool);

    // Verify deletion
    const verifyDeletion = await School.findById(schoolIdToDelete);
    console.log('✅ School still exists after deletion?', !!verifyDeletion);

    // List all schools after deletion
    console.log('\n📋 Schools after deletion:');
    const schoolsAfter = await School.find({}, '_id name code');
    console.table(schoolsAfter.map(s => ({ id: s._id.toString(), name: s.name, code: s.code })));

    console.log(`\n📊 Schools count: ${schoolsBefore.length} → ${schoolsAfter.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

testSchoolDeletion();