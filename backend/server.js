const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const DatabaseManager = require('./utils/databaseManager');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Middleware to attach mainDb to req
app.use((req, res, next) => {
  req.mainDb = mongoose.connection.db;
  console.log('[DEBUG] mainDb middleware executed. mainDb:', req.mainDb);
  next();
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const schoolRoutes = require('./routes/schools');
const schoolUserRoutes = require('./routes/schoolUsers');
const admissionRoutes = require('./routes/admissions');
const assignmentRoutes = require('./routes/assignments');
const attendanceRoutes = require('./routes/attendance');
const subjectRoutes = require('./routes/subjects');
const timetableRoutes = require('./routes/timetables');
const resultRoutes = require('./routes/results');
const configRoutes = require('./routes/config');
const testDetailsRoutes = require('./routes/testDetails');

// Serve uploads statically
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/school-users', schoolUserRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/config', configRoutes);
app.use('/api/test-details', testDetailsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// MongoDB connection URI (always use primary URI)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/institute_erp';

mongoose.connect(MONGODB_URI, {
  maxPoolSize: 50, // Maintain up to 50 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: false // Disable mongoose buffering
})
.then(async () => {
  console.log('✅ Connected to MongoDB Atlas with optimizations');
  console.log('📊 Connection pool size: 50');
  
  // Initialize Database Manager
  await DatabaseManager.initialize();
  console.log('✅ Database Manager initialized');
  
  console.log('🚀 Server ready for multi-tenant operations');
  
  // Start server only after successful DB connection and initialization
  app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`🏫 Multi-tenant school ERP system ready`);
  });
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
});

// Ensure JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET is not set. Using a default secret for development purposes.');
  process.env.JWT_SECRET = 'default_development_secret';
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n🔄 Gracefully shutting down...');
  try {
    await DatabaseManager.closeAllConnections();
    await mongoose.connection.close();
    console.log('✅ All connections closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Note: server start moved to after successful DB connect
