const express = require('express');
const router = express.Router();
const testDetailsController = require('../controllers/testDetailsController');
const authMiddleware = require('../middleware/auth');
const { setSchoolContext, requireSchoolContext, validateSchoolAccess, setMainDbContext, requireSuperAdmin } = require('../middleware/schoolContext');

// Apply authentication middleware to all routes
router.use(authMiddleware.auth);

// Superadmin routes first (before school context middleware)
// Get test details by school ID (for superadmin)
router.get(
  '/:schoolId',
  setMainDbContext,
  requireSuperAdmin,
  testDetailsController.getTestDetailsBySchoolId
);

// Superadmin routes for managing any school's test details
router.get(
  '/school/:schoolCode',
  setMainDbContext,
  requireSuperAdmin,
  testDetailsController.getSchoolTestDetails
);

router.put(
  '/school/:schoolCode',
  setMainDbContext,
  requireSuperAdmin,
  testDetailsController.updateSchoolTestDetails
);

// Routes for admin/teacher access (school-specific)
router.use(setSchoolContext);

// Get test details for current school
router.get(
  '/',
  validateSchoolAccess(['admin', 'teacher']),
  testDetailsController.getTestDetails
);

// Update test details for current school (admin only)
router.put(
  '/',
  requireSchoolContext,
  validateSchoolAccess(['admin']),
  testDetailsController.updateTestDetails
);

module.exports = router;
