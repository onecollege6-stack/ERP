const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://nitopunk04o:IOilWo4osDam0vmN@erp.ua5qems.mongodb.net/institute_erp?retryWrites=true&w=majority&appName=erp';

async function cleanupOldSuperAdmin() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️ Removing superadmin users from regular Users collection...');
    const result = await User.deleteMany({ role: 'superadmin' });
    console.log(`✅ Removed ${result.deletedCount} superadmin user(s) from Users collection`);
    
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error cleaning up:', error);
    process.exit(1);
  }
}

cleanupOldSuperAdmin();
