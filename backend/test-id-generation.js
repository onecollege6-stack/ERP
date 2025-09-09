const mongoose = require('mongoose');
require('dotenv').config();

// Import the generateSequentialUserId function from userController
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

    // Access the school-specific database directly
    const schoolDbName = `school_${schoolCode.toLowerCase()}`;
    const schoolDb = mongoose.connection.useDb(schoolDbName);
    
    // Define a simple user schema for querying
    const userSchema = new mongoose.Schema({
      userId: String,
      role: String
    }, { strict: false });

    // Create the pattern to search for IDs in the format: SCHOOLCODE-ROLE-XXXX
    const pattern = `${schoolCode.toUpperCase()}-${roleCode}-`;
    
    console.log(`🔍 Searching for existing IDs with pattern: ${pattern}`);

    // Check all collections for user IDs
    const collections = ['admins', 'teachers', 'students', 'parents'];
    let allExistingUsers = [];
    
    for (const collectionName of collections) {
      try {
        const UserModel = schoolDb.model(`${collectionName}_temp_${Date.now()}`, userSchema, collectionName);
        const users = await UserModel.find({
          userId: { $regex: `^${pattern}\\d{4}$`, $options: 'i' }
        }).select('userId').lean();
        allExistingUsers = allExistingUsers.concat(users);
      } catch (error) {
        // Collection might not exist, continue
      }
    }

    console.log(`📊 Found ${allExistingUsers.length} existing users with pattern ${pattern}`);

    let maxNumber = 0;

    // Extract numbers from existing user IDs
    allExistingUsers.forEach(user => {
      const match = user.userId.match(new RegExp(`^${pattern}(\\d{4})$`, 'i'));
      if (match) {
        const number = parseInt(match[1], 10);
        if (number > maxNumber) {
          maxNumber = number;
        }
        console.log(`  📄 Found: ${user.userId} (number: ${number})`);
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
