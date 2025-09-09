const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const timetableController = require('../controllers/timetableController');

// Smart timetable creation with conflict detection
router.post('/create-smart', 
  authMiddleware.auth, 
  timetableController.createSmartTimetable
);

// Get timetable with efficiency analysis
router.get('/:classSection/analysis', 
  authMiddleware.auth, 
  timetableController.getTimetableWithAnalysis
);

// Create substitute teacher arrangement
router.post('/substitute', 
  authMiddleware.auth, 
  timetableController.createSubstituteArrangement
);

module.exports = router;
