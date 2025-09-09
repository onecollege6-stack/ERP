const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { auth, authorize } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Attendance management routes
router.post('/mark', authorize(['admin', 'teacher']), attendanceController.markAttendance);
router.post('/mark-session', attendanceController.markSessionAttendance); // Temporarily removed authorization for debugging
router.post('/mark-bulk', authorize(['admin', 'teacher']), attendanceController.markBulkAttendance);
router.get('/', attendanceController.getAttendance);
router.get('/session-status', attendanceController.checkSessionStatus); // Check if session is marked/frozen
router.get('/class', attendanceController.getClassAttendance); // Temporarily removed authorization for debugging
router.get('/stats', authorize(['admin', 'teacher']), attendanceController.getAttendanceStats);
router.get('/student-report', attendanceController.getStudentAttendanceReport);

// Attendance-specific routes
router.patch('/:attendanceId/lock', authorize(['admin', 'teacher']), attendanceController.lockAttendance);

module.exports = router;
