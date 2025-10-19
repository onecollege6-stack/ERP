const express = require('express');
const router = express.Router();
const userManagementController = require('../controllers/userManagementController');
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

// Get all users for a school
router.get('/:schoolCode/users',
  auth,
  setMainDbContext,
  requireAdminAccess,
  userManagementController.getAllUsers
);

// Get user by ID
router.get('/:schoolCode/users/:userId',
  auth,
  setMainDbContext,
  requireAdminAccess,
  userManagementController.getUserById
);

// Create new user
router.post('/:schoolCode/users',
  auth,
  setMainDbContext,
  requireAdminAccess,
  userManagementController.createUser
);

// Update user
router.put('/:schoolCode/users/:userId',
  auth,
  setMainDbContext,
  requireAdminAccess,
  userManagementController.updateUser
);

// Delete user
router.delete('/:schoolCode/users/:userId',
  auth,
  setMainDbContext,
  requireAdminAccess,
  userManagementController.deleteUser
);

// Reset user password (admin/teacher only)
router.post('/:schoolCode/users/:userId/reset-password',
  auth,
  setMainDbContext,
  requireAdminAccess,
  userManagementController.resetPassword
);

module.exports = router;
