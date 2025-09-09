const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const resultController = require('../controllers/resultController');

// Create or update student result
router.post('/create', 
  authMiddleware.auth, 
  resultController.createOrUpdateResult
);

// Get student result history
router.get('/student/:studentId/history', 
  authMiddleware.auth, 
  resultController.getStudentResultHistory
);

// Generate class performance report
router.get('/class/:grade/:section/report', 
  authMiddleware.auth, 
  resultController.generateClassPerformanceReport
);

module.exports = router;
