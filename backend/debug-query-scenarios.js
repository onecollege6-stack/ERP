const mongoose = require('mongoose');
require('dotenv').config();

const TestDetails = require('./models/TestDetails');

async function debugTestDetailsQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== Testing different query scenarios ===');

    // Test 1: Query with lowercase "nps"
    console.log('\n1. Query with lowercase "nps":');
    const result1 = await TestDetails.findOne({
      schoolCode: 'nps',
      academicYear: '2024-25'
    });
    console.log('Result:', result1 ? 'FOUND' : 'NOT FOUND');

    // Test 2: Query with uppercase "NPS"
    console.log('\n2. Query with uppercase "NPS":');
    const result2 = await TestDetails.findOne({
      schoolCode: 'NPS',
      academicYear: '2024-25'
    });
    console.log('Result:', result2 ? 'FOUND' : 'NOT FOUND');
    if (result2) {
      console.log('School Code:', result2.schoolCode);
      console.log('Academic Year:', result2.academicYear);
      console.log('Classes:', Object.keys(result2.classTestTypes?.toObject() || {}));
    }

    // Test 3: Query with wrong academic year
    console.log('\n3. Query with wrong academic year "nps":');
    const result3 = await TestDetails.findOne({
      schoolCode: 'NPS',
      academicYear: 'nps'
    });
    console.log('Result:', result3 ? 'FOUND' : 'NOT FOUND');

    // Test 4: List all entries to see what exists
    console.log('\n4. All test details entries:');
    const allEntries = await TestDetails.find({});
    allEntries.forEach((entry, index) => {
      console.log(`Entry ${index + 1}:`);
      console.log(`  - School Code: "${entry.schoolCode}"`);
      console.log(`  - Academic Year: "${entry.academicYear}"`);
      console.log(`  - Classes: ${Object.keys(entry.classTestTypes?.toObject() || {}).join(', ')}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugTestDetailsQuery();