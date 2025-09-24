const express = require('express');
const router = express.Router();
const adminClassController = require('../controllers/adminClassController');
const { auth } = require('../middleware/auth');
const { setMainDbContext } = require('../middleware/schoolContext');

// Middleware to verify admin access
const requireAdminAccess = (req, res, next) => {
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Get all classes and sections for a school (for admin users)
router.get('/:schoolCode/classes-sections', 
  auth, 
  setMainDbContext, 
  requireAdminAccess, 
  adminClassController.getSchoolClassesAndSections
);

// Get sections for a specific class
router.get('/:schoolCode/classes/:className/sections', 
  auth, 
  setMainDbContext, 
  requireAdminAccess, 
  adminClassController.getSectionsForClass
);

// Get all tests/exams for a school
router.get('/:schoolCode/tests', 
  auth, 
  setMainDbContext, 
  requireAdminAccess, 
  adminClassController.getSchoolTests
);

module.exports = router;
