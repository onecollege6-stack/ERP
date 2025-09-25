const express = require('express');
const router = express.Router();
const feesController = require('../controllers/feesController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Apply authentication middleware to all routes
router.use(authMiddleware.auth);

// Apply role check - only ADMIN and SUPER_ADMIN can access
router.use(roleCheck(['admin', 'superadmin']));

// Fee Structure routes
router.post('/structures', feesController.createFeeStructure);
router.get('/structures', feesController.getFeeStructures);

// Student Fee Records routes
router.get('/records', feesController.getStudentFeeRecords);
router.get('/stats', feesController.getFeeStats);

// Payment routes
router.post('/records/:studentId/offline-payment', feesController.recordOfflinePayment);

module.exports = router;
