const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/institute_erp_central', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const { generateSequentialUserId } = require('./controllers/userController');

async function testAllRoles() {
  console.log('🚀 Testing Sequential ID Generation for All Roles');
  console.log('=' * 60);
  
  const schoolCode = 'P'; // School code
  const roles = ['admin', 'teacher', 'student', 'parent'];
  
  for (const role of roles) {
    console.log(`\n📝 Testing ${role.toUpperCase()} role:`);
    console.log('-'.repeat(40));
    
    try {
      const generatedId = await generateSequentialUserId(schoolCode, role);
      console.log(`🎯 Final Result: ${generatedId}`);
    } catch (error) {
      console.error(`❌ Error for ${role}:`, error.message);
    }
  }
  
  console.log('\n🏁 Test completed!');
  process.exit(0);
}

// Wait for database connection
mongoose.connection.once('open', () => {
  console.log('✅ Connected to MongoDB');
  testAllRoles();
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});
