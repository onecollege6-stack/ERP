const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const schoolController = require('../controllers/schoolController');
const exportImportController = require('../controllers/exportImportController');
const authMiddleware = require('../middleware/auth');
const { setSchoolContext, validateSchoolAccess, requireSuperAdmin, setMainDbContext } = require('../middleware/schoolContext');

// Upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `school-logo-${unique}${ext}`);
  }
});
const upload = multer({ storage });

// Apply authentication middleware to all routes
router.use(authMiddleware.auth);

// Super Admin routes (work with main database)
router.post('/', setMainDbContext, requireSuperAdmin, upload.single('logo'), async (req, res) => {
  try {
    console.log('Creating school with data:', req.body);
    console.log('Uploaded file:', req.file);
    await schoolController.createSchool(req, res);
  } catch (error) {
    console.error('Error in POST /schools route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
router.get('/', setMainDbContext, requireSuperAdmin, schoolController.getAllSchools);
router.get('/stats', setMainDbContext, requireSuperAdmin, schoolController.getSchoolStats);
router.get('/all-stats', setMainDbContext, requireSuperAdmin, schoolController.getAllSchoolsStats);

// School data sync routes (Super Admin only)
router.post('/sync/all', setMainDbContext, requireSuperAdmin, schoolController.syncAllSchoolsToDatabase);
router.post('/:schoolId/sync', setMainDbContext, requireSuperAdmin, schoolController.syncSchoolToDatabase);

// School-specific routes (require school context)
router.get('/:schoolId', setSchoolContext, validateSchoolAccess(['admin', 'superadmin']), schoolController.getSchoolById);

// Direct school info route (bypasses school-specific database issues)
router.get('/:schoolId/info', authMiddleware.auth, schoolController.getSchoolInfo);
router.put('/:schoolId', schoolController.updateSchool);
router.patch('/:schoolId/access-matrix', setMainDbContext, requireSuperAdmin, schoolController.updateAccessMatrix);
router.delete('/:schoolId', setMainDbContext, requireSuperAdmin, schoolController.deleteSchool);
// Update only bank details
router.patch('/:schoolId/bank-details', schoolController.updateBankDetails);
router.patch('/:schoolId/toggle-status', schoolController.toggleSchoolStatus);

// Classes and sections endpoint (canonical data)
router.get('/:schoolId/classes', schoolController.getClassesForSchool);

// User management routes
router.get('/:schoolId/users', schoolController.getSchoolUsers);
router.post('/:schoolId/users', schoolController.addUser);
router.post('/:schoolId/admins', schoolController.addAdminToSchool);
router.post('/:schoolId/users/import', upload.single('file'), schoolController.importUsers);
router.get('/:schoolId/users/export', schoolController.exportUsers);

// Comprehensive export/import routes
router.get('/:schoolCode/export/users', exportImportController.exportUsers);
router.post('/:schoolCode/import/users', upload.single('file'), exportImportController.importUsers);
router.get('/:schoolCode/template/:role', exportImportController.generateTemplate);
router.put('/:schoolId/users/:userId', schoolController.updateUser);
router.delete('/:schoolId/users/:userId', schoolController.deleteUser);
router.patch('/:schoolId/users/:userId/status', schoolController.toggleUserStatus);
router.patch('/:schoolId/users/:userId/password', schoolController.updateUserPassword);

// Bulk user operations
router.post('/:schoolId/users/bulk/delete', schoolController.bulkDeleteUsers);
router.patch('/:schoolId/users/bulk/status', schoolController.bulkToggleUserStatus);

module.exports = router;
