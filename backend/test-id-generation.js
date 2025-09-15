const mongoose = require('mongoose');
require('dotenv').config();


MONGODB_URI=mongodb+srv;nitopunk04o:IOilWo4osDam0vmN@erp.ua5qems.mongodb.net/institute_erp?retryWrites=true&w=majority&appName=erp;


// Use the real generateSequentialUserId from the controller
const { generateSequentialUserId } = require('./controllers/userController');

async function testIdGeneration() {
  try {
    // Connect to database using .env configuration
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB using .env configuration');
    
    // Test for all roles
    const schoolCode = 'p';
    const roles = ['admin', 'teacher', 'student', 'parent'];
    
    console.log(`\n🏫 Testing ID generation for school: ${schoolCode.toUpperCase()}\n`);
    
    for (const role of roles) {
      console.log(`\n📋 Testing ${role.toUpperCase()} role:`);
      const newId = await generateSequentialUserId(schoolCode, role);
      console.log(`🆔 Next ${role} ID would be: ${newId}\n`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testIdGeneration();
