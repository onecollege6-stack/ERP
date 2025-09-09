const mongoose = require('mongoose');
require('dotenv').config();

async function fixAttendanceIndexes() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb+srv://nitopunk04o:IOilWo4osDam0vmN@erp.ua5qems.mongodb.net/institute_erp?retryWrites=true&w=majority&appName=erp';
    await mongoose.connect(uri, {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('attendances');

    // Check existing indexes
    console.log('📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Drop the problematic unique index if it exists
    try {
      await collection.dropIndex({ schoolId: 1, class: 1, section: 1, date: 1 });
      console.log('✅ Dropped old unique index: schoolId_1_class_1_section_1_date_1');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Index schoolId_1_class_1_section_1_date_1 does not exist (already dropped)');
      } else {
        console.log('❌ Error dropping index:', error.message);
      }
    }

    // Create new correct indexes
    await collection.createIndex({ schoolId: 1, studentId: 1, date: 1 }, { unique: true });
    console.log('✅ Created new unique index: schoolId_1_studentId_1_date_1');

    await collection.createIndex({ schoolId: 1, class: 1, section: 1, date: 1 });
    console.log('✅ Created non-unique index: schoolId_1_class_1_section_1_date_1');

    console.log('📋 Updated indexes:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('🎯 Attendance indexes fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔐 Disconnected from MongoDB');
  }
}

fixAttendanceIndexes();
