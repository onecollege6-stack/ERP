const mongoose = require('mongoose');
require('dotenv').config();

async function fixUserSchoolAssociation() {
  try {
    // First connect to the main database to get school info
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/institute-erp';
    console.log('Connecting to main database:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to main database');
    
    // Get the correct school info
    const School = mongoose.model('School', new mongoose.Schema({}, { strict: false }));
    const school = await School.findOne({ code: 'P' });
    
    if (!school) {
      console.log('❌ School with code P not found');
      return;
    }
    
    console.log('✅ Found school:', {
      id: school._id,
      code: school.code,
      name: school.name
    });
    
    await mongoose.disconnect();
    
    // Now connect to the school-specific database
    const schoolDbUri = mongoUri.replace('/institute_erp', '/school_p');
    console.log('Connecting to school database:', schoolDbUri);
    
    await mongoose.connect(schoolDbUri);
    console.log('✅ Connected to school database');
    
    // Check the admins collection
    const collection = mongoose.connection.db.collection('admins');
    const users = await collection.find({}).toArray();
    
    console.log(`Found ${users.length} users in admins collection:`);
    users.forEach(user => {
      console.log(`- Email: ${user.email}, SchoolId: ${user.schoolId}, SchoolCode: ${user.schoolCode}`);
    });
    
    // Find the specific user
    const user = await collection.findOne({ email: 'admin@test.com' });
    
    if (user) {
      console.log('✅ Found user in admins collection');
      console.log('Current user data:', {
        email: user.email,
        schoolId: user.schoolId,
        schoolCode: user.schoolCode,
        role: user.role
      });
      
      // Update the user with correct school information
      const updateResult = await collection.updateOne(
        { email: 'admin@test.com' },
        {
          $set: {
            schoolId: school._id.toString(),
            schoolCode: school.code,
            schoolName: school.name
          }
        }
      );
      
      console.log('✅ Updated user:', updateResult);
      
      // Verify the update
      const updatedUser = await collection.findOne({ email: 'admin@test.com' });
      console.log('✅ Updated user data:', {
        email: updatedUser.email,
        schoolId: updatedUser.schoolId,
        schoolCode: updatedUser.schoolCode,
        schoolName: updatedUser.schoolName,
        role: updatedUser.role
      });
    } else {
      console.log('❌ User admin@test.com not found in admins collection');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixUserSchoolAssociation();
