const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const superadminTestController = require('../controllers/superadminTestController');

// Apply authentication and role check to all routes
router.use(auth);
router.use(roleCheck(['superadmin']));

// Get all test details for a school
router.get('/schools/:schoolId/tests', 
  superadminTestController.getSchoolTestDetails
);

// Get test types for a specific class in a school
router.get('/schools/:schoolId/tests/class/:className', 
  superadminTestController.getSchoolClassTestTypes
);

// Add test type to a specific class
router.post('/schools/:schoolId/tests/class/:className', 
  superadminTestController.addTestTypeToClass
);

// Remove test type from a specific class
router.delete('/schools/:schoolId/tests/class/:className/test/:testTypeCode', 
  superadminTestController.removeTestTypeFromClass
);

// Update school academic settings (includes classes which affects test details)
router.put('/schools/:schoolId/settings', 
  superadminTestController.updateSchoolAcademicSettings
);

module.exports = router;
