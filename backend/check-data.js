const mongoose = require('mongoose');
require('dotenv').config();

async function checkData() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/institute-erp';
    console.log('Connecting to:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Check schools
    const School = mongoose.model('School', new mongoose.Schema({}, { strict: false }));
    const schools = await School.find({}).limit(10);
    console.log('\n📚 Available schools:');
    schools.forEach(school => {
      console.log(`- ID: ${school._id}, Code: ${school.code}, Name: ${school.name}`);
    });
    
    // Check the problematic user
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne({ email: 'admin@test.com' });
    console.log('\n👤 Current user school data:');
    console.log({
      email: user?.email,
      schoolId: user?.schoolId,
      schoolCode: user?.schoolCode,
      schoolName: user?.schoolName,
      role: user?.role
    });
    
    // Check available collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Available collections:');
    collections.forEach(coll => console.log(`- ${coll.name}`));
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkData();
