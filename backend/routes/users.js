const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { setSchoolContext, requireSchoolContext, validateSchoolAccess } = require('../middleware/schoolContext');

// Apply authentication middleware to all routes
router.use(authMiddleware.auth);

// User creation routes - require explicit school context for super admin operations
router.post('/', requireSchoolContext, validateSchoolAccess(['admin', 'superadmin']), userController.createUserSimple);
router.post('/teachers', requireSchoolContext, validateSchoolAccess(['admin', 'superadmin']), userController.addTeacher);
router.post('/students', requireSchoolContext, validateSchoolAccess(['admin', 'superadmin']), userController.addStudent);
router.post('/parents', requireSchoolContext, validateSchoolAccess(['admin', 'superadmin']), userController.addParent);

// Query routes - use flexible school context
router.use(setSchoolContext);

// Get next available user ID for preview
router.get('/next-id/:role', validateSchoolAccess(['admin', 'superadmin']), userController.getNextUserId);

// Get users by role (accessible by admin and teachers for their school)
router.get('/role/:role', validateSchoolAccess(['admin', 'teacher']), userController.getUsersByRole);
router.get('/:userId', validateSchoolAccess(['admin', 'teacher']), userController.getUserById);

// Update and manage users (admin only) - require explicit school context
router.put('/:userId', requireSchoolContext, validateSchoolAccess(['admin', 'superadmin']), userController.updateUser);
router.patch('/:userId/reset-password', requireSchoolContext, validateSchoolAccess(['admin', 'superadmin']), userController.resetUserPassword);
router.patch('/:userId/toggle-status', requireSchoolContext, validateSchoolAccess(['admin', 'superadmin']), userController.toggleUserStatus);

module.exports = router;
