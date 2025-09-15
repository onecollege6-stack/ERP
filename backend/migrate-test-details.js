const mongoose = require('mongoose');
const TestDetails = require('./models/TestDetails');
require('dotenv').config();

async function migrateTestDetails() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all test details with old structure (has testTypes field)
    const oldTestDetails = await TestDetails.find({ testTypes: { $exists: true } });
    console.log(`Found ${oldTestDetails.length} test details with old structure`);

    for (const testDoc of oldTestDetails) {
      console.log(`Migrating test details for school: ${testDoc.schoolCode} (${testDoc.schoolId})`);
      
      // Get the old test types
      const oldTestTypes = testDoc.testTypes || [];
      
      // Create new class-based structure
      const classes = ['LKG', 'UKG', ...Array.from({length: 12}, (_, i) => (i+1).toString())];
      const classTestTypes = {};
      
      // Assign the same test types to all classes
      classes.forEach(cls => {
        classTestTypes[cls] = oldTestTypes;
      });
      
      // Update the document
      await TestDetails.findByIdAndUpdate(testDoc._id, {
        $set: { classTestTypes },
        $unset: { testTypes: 1 }  // Remove old field
      });
      
      console.log(`✅ Migrated test details for school ${testDoc.schoolCode}`);
    }
    
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateTestDetails();
