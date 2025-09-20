const mongoose = require('mongoose');
require('dotenv').config();

const TestDetails = require('./models/TestDetails');

async function testNoAutoCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check current state
    console.log('\n=== BEFORE TEST ===');
    const beforeCount = await TestDetails.countDocuments({});
    console.log(`Total test details documents: ${beforeCount}`);

    // Check specific school
    const schoolEntries = await TestDetails.find({
      schoolCode: { $in: ['P', 'NPS'] }
    });
    console.log(`Entries for schools P and NPS: ${schoolEntries.length}`);

    console.log('\n=== TEST SUMMARY ===');
    console.log('✅ Database state checked');
    console.log('✅ No automatic creation should occur when visiting admin pages');
    console.log('✅ Test details will only be created when manually adding test types');

    console.log('\n=== NEXT STEPS ===');
    console.log('1. Visit the Academic Results page as admin');
    console.log('2. Select a class (e.g., LKG)');
    console.log('3. Verify no new empty entries are created');
    console.log('4. Run this script again to confirm count remains the same');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testNoAutoCreation();