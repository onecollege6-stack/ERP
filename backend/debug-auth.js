const mongoose = require('mongoose');
const ClassSubjectsSimple = require('./models/ClassSubjectsSimple');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const DatabaseManager = require('./utils/databaseManager');
require('dotenv').config();

async function debugAuthAndPermissions() {
  try {
    // This function will help diagnose permission issues
    console.log('🔎 Debugging authentication and permissions...');
    
    // 1. Check JWT_SECRET is properly set
    console.log(`JWT_SECRET is ${process.env.JWT_SECRET ? 'set' : 'NOT SET'}`);
    
    // 2. Check database connections
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to main database');
    
    // 3. Check token validation
    const token = 'YOUR_TOKEN_HERE'; // Replace with a real token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token validation successful:', decoded);
      
      // 4. Check user exists
      const { userId, schoolCode } = decoded;
      
      if (schoolCode) {
        console.log(`Looking for school user ${userId} in school ${schoolCode}`);
        const schoolConn = await DatabaseManager.getSchoolConnection(schoolCode);
        // Use appropriate collection based on role
        const role = decoded.role.toLowerCase();
        const collectionName = role === 'admin' ? 'admins' : 
                              role === 'teacher' ? 'teachers' : 
                              role === 'student' ? 'students' : 
                              role === 'parent' ? 'parents' : 'users';
        
        const UserModel = mongoose.model(collectionName, new mongoose.Schema({}), collectionName);
        const user = await UserModel.findOne({ userId });
        
        if (user) {
          console.log('✅ User found in school database:', {
            id: user._id,
            userId: user.userId,
            role: user.role,
            permissions: user.adminInfo?.permissions || user.teacherInfo?.permissions || []
          });
        } else {
          console.log('❌ User not found in school database');
        }
      } else {
        // For superadmin users in main DB
        const user = await User.findById(userId);
        if (user) {
          console.log('✅ User found in main database:', {
            id: user._id,
            role: user.role
          });
        } else {
          console.log('❌ User not found in main database');
        }
      }
    } catch (error) {
      console.log('❌ Token validation failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

debugAuthAndPermissions();
