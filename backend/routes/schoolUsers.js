const express = require('express');
const router = express.Router();
const schoolUserController = require('../controllers/schoolUserController');
const authMiddleware = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authMiddleware.auth);

// User management routes for specific schools
// Route format: /api/school-users/:schoolCode/...

// Add user to school
router.post('/:schoolCode/users', schoolUserController.addUserToSchool);

// Get all users in a school
router.get('/:schoolCode/users', schoolUserController.getAllSchoolUsers);

// Get users by role
router.get('/:schoolCode/users/role/:role', schoolUserController.getUsersByRole);

// Get specific user
router.get('/:schoolCode/users/:userId', schoolUserController.getUserById);

// Update user
router.put('/:schoolCode/users/:userId', schoolUserController.updateUser);

// Reset user password
router.post('/:schoolCode/users/:userId/reset-password', schoolUserController.resetUserPassword);

// Toggle user status
router.patch('/:schoolCode/users/:userId/status', schoolUserController.toggleUserStatus);

// Delete user
router.delete('/:schoolCode/users/:userId', schoolUserController.deleteUser);

// Access matrix management
router.get('/:schoolCode/access-matrix', schoolUserController.getAccessMatrix);
router.put('/:schoolCode/access-matrix', schoolUserController.updateAccessMatrix);

// Timetable management routes
router.get('/:schoolCode/timetables', schoolUserController.getAllTimetables);
router.get('/:schoolCode/timetables/:className/:section', schoolUserController.getTimetableByClass);
router.post('/:schoolCode/timetables', schoolUserController.createTimetable);
router.put('/:schoolCode/timetables/:className/:section', schoolUserController.updateTimetable);
router.delete('/:schoolCode/timetables/:className/:section', schoolUserController.deleteTimetable);

module.exports = router;
