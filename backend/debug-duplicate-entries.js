const mongoose = require('mongoose');
require('dotenv').config();

const TestDetails = require('./models/TestDetails');

async function checkDuplicateEntries() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all test details for school "NPS"
    const allTestDetails = await TestDetails.find({
      schoolCode: 'NPS'
    }).sort({ createdAt: -1 });

    console.log(`Found ${allTestDetails.length} test details entries for school NPS:`);
    
    allTestDetails.forEach((entry, index) => {
      console.log(`\n--- Entry ${index + 1} ---`);
      console.log('ID:', entry._id);
      console.log('Created At:', entry.createdAt);
      console.log('Academic Year:', entry.academicYear);
      console.log('Class Test Types Keys:', Object.keys(entry.classTestTypes?.toObject() || {}));
      
      if (entry.classTestTypes) {
        const classTestTypesObj = entry.classTestTypes.toObject();
        Object.entries(classTestTypesObj).forEach(([className, testTypes]) => {
          if (Array.isArray(testTypes)) {
            console.log(`  ${className}: ${testTypes.length} test types`);
            testTypes.forEach(test => {
              console.log(`    - ${test.name || 'Unnamed'} (${test.code || 'No code'})`);
            });
          }
        });
      }
    });

    // Check for completely empty entries
    const emptyEntries = allTestDetails.filter(entry => {
      const classTestTypesObj = entry.classTestTypes?.toObject() || {};
      const totalTests = Object.values(classTestTypesObj).reduce((acc, tests) => {
        return acc + (Array.isArray(tests) ? tests.length : 0);
      }, 0);
      return totalTests === 0;
    });

    console.log(`\n📊 Summary:`);
    console.log(`Total entries: ${allTestDetails.length}`);
    console.log(`Empty entries: ${emptyEntries.length}`);

    if (emptyEntries.length > 0) {
      console.log('\n🗑️ Empty entries that could be deleted:');
      emptyEntries.forEach(entry => {
        console.log(`- ${entry._id} (created ${entry.createdAt})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDuplicateEntries();