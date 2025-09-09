const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/institute_erp_central', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const generateSequentialUserId = async (schoolCode, role) => {
  try {
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

    const ModelFactory = require('./utils/modelFactory');
    const SchoolUser = await ModelFactory.getUserModel(schoolCode);

    const pattern = `${schoolCode.toUpperCase()}-${roleCode}-`;
    
    const existingUsers = await SchoolUser.find({
      userId: { $regex: `^${pattern}\\d{4}$`, $options: 'i' }
    }).select('userId').lean();

    let maxNumber = 0;

    existingUsers.forEach(user => {
      const match = user.userId.match(new RegExp(`^${pattern}(\\d{4})$`, 'i'));
      if (match) {
        const number = parseInt(match[1], 10);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    });

    const nextNumber = maxNumber + 1;
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    const newUserId = `${schoolCode.toUpperCase()}-${roleCode}-${formattedNumber}`;

    console.log(`✅ Next ID for ${role}: ${newUserId} (existing: ${existingUsers.length}, max: ${maxNumber})`);
    
    return newUserId;

  } catch (error) {
    console.error('❌ Error generating sequential user ID:', error);
    throw error;
  }
};

async function createTestUsers() {
  console.log('🚀 Creating Test Users to Verify Sequential ID Generation');
  console.log('=' * 60);
  
  const schoolCode = 'P';
  const ModelFactory = require('./utils/modelFactory');
  const SchoolUser = await ModelFactory.getUserModel(schoolCode);
  
  // Create some test users with existing IDs
  const testUsers = [
    { userId: 'P-A-0001', name: 'Admin Test 1', email: 'admin1@test.com', role: 'admin' },
    { userId: 'P-A-0003', name: 'Admin Test 3', email: 'admin3@test.com', role: 'admin' },
    { userId: 'P-T-0001', name: 'Teacher Test 1', email: 'teacher1@test.com', role: 'teacher' },
    { userId: 'P-T-0005', name: 'Teacher Test 5', email: 'teacher5@test.com', role: 'teacher' },
    { userId: 'P-S-0002', name: 'Student Test 2', email: 'student2@test.com', role: 'student' },
    { userId: 'P-S-0007', name: 'Student Test 7', email: 'student7@test.com', role: 'student' },
  ];
  
  console.log('📝 Creating test users...');
  
  for (const user of testUsers) {
    try {
      const existing = await SchoolUser.findOne({ userId: user.userId });
      if (!existing) {
        await SchoolUser.create({
          ...user,
          password: 'test123',
          createdAt: new Date()
        });
        console.log(`✅ Created: ${user.userId}`);
      } else {
        console.log(`⚠️ Already exists: ${user.userId}`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${user.userId}:`, error.message);
    }
  }
  
  console.log('\n🔍 Now testing next ID generation:');
  console.log('-'.repeat(50));
  
  const roles = ['admin', 'teacher', 'student', 'parent'];
  
  for (const role of roles) {
    console.log(`\n📝 Testing ${role.toUpperCase()} role:`);
    try {
      const nextId = await generateSequentialUserId(schoolCode, role);
      console.log(`🎯 Next ${role} ID: ${nextId}`);
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
  createTestUsers();
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});
