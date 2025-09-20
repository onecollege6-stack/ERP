require('dotenv').config();

console.log('=== Environment Variable Check ===');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
console.log('PORT:', process.env.PORT);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');

if (process.env.MONGODB_URI) {
  console.log('\n=== MongoDB URI Details ===');
  const uri = process.env.MONGODB_URI;
  console.log('Full URI:', uri);
  console.log('Host:', uri.includes('erp.ua5qems.mongodb.net') ? '✅ Correct Atlas cluster' : '❌ Wrong host');
  console.log('Database:', uri.includes('institute_erp') ? '✅ Correct database' : '❌ Wrong database');
  console.log('App Name:', uri.includes('appName=erp') ? '✅ App name set' : '❌ App name missing');
} else {
  console.log('❌ MONGODB_URI not found in environment variables');
}

console.log('\n=== Connection Test ===');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Successfully connected to MongoDB using .env URI');
    console.log('✅ Database name:', mongoose.connection.db.databaseName);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  });