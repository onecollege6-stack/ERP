const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/institute_erp_central', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const generateSequentialUserId = async (schoolCode, role) => {
  try {
    // Role mappings
    const roleMappings = {
      'admin': 'A',
      'teacher': 'T', 
      'student': 'S',
      'parent': 'P'
    };

    const roleCode = roleMappings[role];
    if (!roleCode) {
      throw new Error(`Invalid role: ${role}`);
    }

    // Use school-specific database (async call)
    const ModelFactory = require('./utils/modelFactory');
    const SchoolUser = await ModelFactory.getUserModel(schoolCode);

    // Create the pattern to search for IDs in the format: SCHOOLCODE-ROLE-XXXX
    const pattern = `${schoolCode.toUpperCase()}-${roleCode}-`;
    
    console.log(`🔍 Searching for existing IDs with pattern: ${pattern}`);

    // Find all users with IDs matching this pattern
    const existingUsers = await SchoolUser.find({
      userId: { $regex: `^${pattern}\\d{4}$`, $options: 'i' }
    }).select('userId').lean();

    console.log(`📊 Found ${existingUsers.length} existing users with pattern ${pattern}`);
    if (existingUsers.length > 0) {
      console.log(`📋 Existing IDs: ${existingUsers.map(u => u.userId).join(', ')}`);
    }

    let maxNumber = 0;

    // Extract numbers from existing user IDs
    existingUsers.forEach(user => {
      const match = user.userId.match(new RegExp(`^${pattern}(\\d{4})$`, 'i'));
      if (match) {
        const number = parseInt(match[1], 10);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    });

    // Generate next sequential number
    const nextNumber = maxNumber + 1;
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    const newUserId = `${schoolCode.toUpperCase()}-${roleCode}-${formattedNumber}`;

    console.log(`✅ Generated new user ID: ${newUserId} (next after ${maxNumber})`);
    
    return newUserId;

  } catch (error) {
    console.error('❌ Error generating sequential user ID:', error);
    throw error;
  }
};

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
