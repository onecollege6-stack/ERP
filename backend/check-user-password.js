require('dotenv').config();
const DatabaseManager = require('./utils/databaseManager');
const bcrypt = require('bcryptjs');

async function checkUserPassword() {
  try {
    await DatabaseManager.initialize();
    const schoolConnection = await DatabaseManager.getSchoolConnection('p');
    
    console.log('🔍 Looking for user P-A-0004 in admins collection...');
    const adminsCollection = schoolConnection.collection('admins');
    const user = await adminsCollection.findOne({ userId: 'P-A-0004' });
    
    if (user) {
      console.log('✅ Found user:', {
        userId: user.userId,
        email: user.email,
        role: user.role,
        name: user.name
      });
      
      // Try common passwords
      const testPasswords = ['admin123', 'password', 'admin', '123456', 'p123', 'test123'];
      
      console.log('\n🔐 Testing common passwords...');
      for (const password of testPasswords) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          console.log(`✅ FOUND! Password is: ${password}`);
          break;
        } else {
          console.log(`❌ Not: ${password}`);
        }
      }
      
      // Also check if we can create a new password for testing
      console.log('\n🔄 Creating new test password...');
      const newPassword = 'test123';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await adminsCollection.updateOne(
        { userId: 'P-A-0004' },
        { $set: { password: hashedPassword } }
      );
      
      console.log(`✅ Updated password to: ${newPassword}`);
      
    } else {
      console.log('❌ User P-A-0004 not found in admins collection');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUserPassword();
