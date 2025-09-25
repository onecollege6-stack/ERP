const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const DatabaseManager = require('./utils/databaseManager');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5050;

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
const classSubjectsRoutes = require('./routes/classSubjects');
const timetableRoutes = require('./routes/timetables');
const resultRoutes = require('./routes/results');
const configRoutes = require('./routes/config');
const testDetailsRoutes = require('./routes/testDetails');
const superadminAcademicRoutes = require('./routes/superadminAcademic');
const superadminSubjectRoutes = require('./routes/superadminSubject');
const superadminClassRoutes = require('./routes/superadminClasses');
const superadminTestRoutes = require('./routes/superadminTests');
const userManagementRoutes = require('./routes/userManagement');
const adminClassRoutes = require('./routes/adminClasses');
const classesRoutes = require('./routes/classes');
const messagesRoutes = require('./routes/messages');
const feesRoutes = require('./routes/fees');
const reportsRoutes = require('./routes/reports');

// Serve uploads statically
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Test endpoint for debugging
app.get('/api/test-endpoint', (req, res) => {
  console.log('[TEST ENDPOINT] Request received');
  console.log('[TEST ENDPOINT] Headers:', req.headers);
  return res.status(200).json({
    success: true,
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Direct test endpoint for class subjects
app.get('/api/direct-test/class-subjects/:className', async (req, res) => {
  try {
    // Get school code from request header, query param, or fallback to 'z'
    let schoolCode = req.headers['x-school-code'] || req.query.schoolCode;
    
    // If user is authenticated, use their school code
    if (req.user && req.user.schoolCode) {
      schoolCode = req.user.schoolCode;
    }
    
    // Fallback if no school code is provided
    if (!schoolCode) {
      console.log('[DIRECT TEST] No school code provided, using default from query param');
      schoolCode = req.query.schoolCode;
    }
    
    if (!schoolCode) {
      return res.status(400).json({
        success: false,
        message: 'School code is required. Please provide in header or query parameter.'
      });
    }
    
    console.log('[DIRECT TEST] Request received for class:', req.params.className, 'in school:', schoolCode);
    
    const className = req.params.className;
    const academicYear = req.query.academicYear || '2024-25';
    
    // Get school connection directly
    const schoolConn = await DatabaseManager.getSchoolConnection(schoolCode);
    const ClassSubjectsSimple = require('./models/ClassSubjectsSimple');
    const SchoolClassSubjects = ClassSubjectsSimple.getModelForConnection(schoolConn);
    
    console.log(`[DIRECT TEST] Looking for class "${className}" in school "${schoolCode}"`);
    
    try {
      const classSubjects = await SchoolClassSubjects.findOne({
        schoolCode,
        className,
        academicYear,
        isActive: true
      });
      
      if (!classSubjects) {
        console.log(`[DIRECT TEST] Class "${className}" not found in school "${schoolCode}"`);
        return res.status(404).json({
          success: false,
          message: `Class "${className}" not found in school "${schoolCode}"`
        });
      }
      
      console.log(`[DIRECT TEST] Found class "${className}" with ${classSubjects.subjects.length} subjects`);
      
      return res.status(200).json({
        success: true,
        message: 'Direct test successful',
        data: {
          classId: classSubjects._id,
          className: classSubjects.className,
          grade: classSubjects.grade,
          section: classSubjects.section,
          academicYear: classSubjects.academicYear,
          schoolCode: schoolCode,
          subjects: classSubjects.subjects.filter(s => s.isActive).map(s => ({ 
            name: s.name, 
            isActive: s.isActive 
          }))
        }
      });
    } catch (error) {
      console.error(`[DIRECT TEST] Database error for school "${schoolCode}":`, error);
      return res.status(500).json({
        success: false,
        message: `Error accessing class data for school "${schoolCode}"`,
        error: error.message
      });
    }
  } catch (error) {
    console.error('[DIRECT TEST] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Direct test failed',
      error: error.message
    });
  }
});

// Direct test endpoint for assignments
app.get('/api/direct-test/assignments', async (req, res) => {
  try {
    // Get school code from request header, query param, or fallback
    let schoolCode = req.headers['x-school-code'] || req.query.schoolCode;
    
    // If user is authenticated, use their school code
    if (req.user && req.user.schoolCode) {
      schoolCode = req.user.schoolCode;
    }
    
    // Fallback if no school code is provided
    if (!schoolCode) {
      console.log('[DIRECT TEST ASSIGNMENTS] No school code provided, using default from query param');
      schoolCode = req.query.schoolCode;
    }
    
    if (!schoolCode) {
      return res.status(400).json({
        success: false,
        message: 'School code is required. Please provide in header or query parameter.'
      });
    }
    
    console.log('[DIRECT TEST ASSIGNMENTS] Request received for school:', schoolCode);
    
    // Get school connection directly
    const schoolConn = await DatabaseManager.getSchoolConnection(schoolCode);
    const AssignmentMultiTenant = require('./models/AssignmentMultiTenant');
    const SchoolAssignment = AssignmentMultiTenant.getModelForConnection(schoolConn);
    
    console.log(`[DIRECT TEST ASSIGNMENTS] Looking for assignments in school "${schoolCode}"`);
    
    try {
      const assignments = await SchoolAssignment.find({
        schoolCode,
        isPublished: true
      }).sort({ createdAt: -1 });
      
      console.log(`[DIRECT TEST ASSIGNMENTS] Found ${assignments.length} assignments in school "${schoolCode}"`);
      return res.status(200).json({
        success: true,
        message: `Found ${assignments.length} assignments in school "${schoolCode}"`,
        assignments,
        schoolCode
      });
    } catch (error) {
      console.error('[DIRECT TEST ASSIGNMENTS] Error fetching assignments:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching assignments',
        error: error.message
      });
    }
  } catch (error) {
    console.error('[DIRECT TEST ASSIGNMENTS] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/school-users', schoolUserRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/class-subjects', classSubjectsRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/config', configRoutes);
app.use('/api/test-details', testDetailsRoutes);
app.use('/api/superadmin/academic', superadminAcademicRoutes);
app.use('/api/superadmin/subjects', superadminSubjectRoutes);
app.use('/api/superadmin/classes', superadminClassRoutes);
app.use('/api/superadmin/tests', superadminTestRoutes);
app.use('/api/user-management', userManagementRoutes);
app.use('/api/admin/classes', adminClassRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/reports', reportsRoutes);

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
