//
// File: jayeshsardesai/erp/ERP-7a5c138ae65bf53237b3e294be93792d26fb324a/backend/routes/schoolUsers.js
//
const express = require('express');
const router = express.Router();
const schoolUserController = require('../controllers/schoolUserController');
const authMiddleware = require('../middleware/auth');

// --- ADD THESE IMPORTS ---
const exportImportController = require('../controllers/exportImportController');
const multer = require('multer');
// Configure Multer for file uploads
const upload = multer({ dest: 'backend/uploads/temp' }); // Ensure this 'temp' directory exists
// -------------------------

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

router.get('/:schoolCode/users/:userId', schoolUserController.getUserById);

// Update user
router.put('/:schoolCode/users/:userId', schoolUserController.updateUser);

// Reset user password
router.post('/:schoolCode/users/:userId/reset-password', schoolUserController.resetUserPassword);

// Change user password (admin sets new password)
router.post('/:schoolCode/users/:userId/change-password', schoolUserController.changeUserPassword);

// Verify admin password and get teacher passwords
router.post('/:schoolCode/verify-admin-password', schoolUserController.verifyAdminAndGetPasswords);

// Toggle user status
router.patch('/:schoolCode/users/:userId/status', schoolUserController.toggleUserStatus);

// Delete user
router.delete('/:schoolCode/users/:userId', schoolUserController.deleteUser);
router.get('/:schoolCode/access-matrix', schoolUserController.getAccessMatrix);
router.put('/:schoolCode/access-matrix', schoolUserController.updateAccessMatrix);

// Timetable management routes
router.get('/:schoolCode/timetables', schoolUserController.getAllTimetables);
router.get('/:schoolCode/timetables/:className/:section', schoolUserController.getTimetableByClass);
router.post('/:schoolCode/timetables', schoolUserController.createTimetable);
router.put('/:schoolCode/timetables/:className/:section', schoolUserController.updateTimetable);
router.delete('/:schoolCode/timetables/:className/:section', schoolUserController.deleteTimetable);


// --- ADD THESE NEW ROUTES FOR IMPORT/EXPORT ---
// Note: The path is /:schoolCode/import/users, which will be /api/school-users/:schoolCode/import/users
router.post(
    '/:schoolCode/import/users',
    upload.single('file'), // 'file' must match the FormData key
    exportImportController.importUsers // This controller function will read the 'role' from req.body
);

router.get(
    '/:schoolCode/export/users',
    exportImportController.exportUsers
);

router.get(
    '/:schoolCode/import/template',
    exportImportController.generateTemplate
);
// --------------------------------------------

module.exports = router;