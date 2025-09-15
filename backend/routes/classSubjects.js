const express = require('express');
const router = express.Router();
const classSubjectsController = require('../controllers/classSubjectsController');
const authMiddleware = require('../middleware/auth');
const { setSchoolContext } = require('../middleware/schoolContext');

// Apply authentication middleware to all routes
router.use(authMiddleware.auth);

// Debug middleware
router.use((req, res, next) => {
  console.log('[CLASS-SUBJECTS DEBUG] Request URL:', req.originalUrl);
  console.log('[CLASS-SUBJECTS DEBUG] User:', {
    userId: req.user?.userId,
    role: req.user?.role,
    schoolCode: req.user?.schoolCode
  });
  next();
});

// Apply school context middleware
router.use(setSchoolContext);

// Class-based Subject Management Routes

/**
 * Add Subject to Class
 * POST /api/class-subjects/add-subject
 * Body: { className, grade, section?, subjectName, subjectType?, teacherId?, teacherName? }
 */
router.post(
  '/add-subject',
  classSubjectsController.addSubjectToClass
);

/**
 * Remove Subject from Class
 * DELETE /api/class-subjects/remove-subject
 * Body: { className, subjectName }
 */
router.delete(
  '/remove-subject',
  classSubjectsController.removeSubjectFromClass
);

/**
 * Get All Classes with Subjects
 * GET /api/class-subjects/classes
 * Query: academicYear?
 */
router.get(
  '/classes',
  classSubjectsController.getAllClassesWithSubjects
);

/**
 * Get Subjects for a Specific Class
 * GET /api/class-subjects/class/:className
 * Query: academicYear?
 */
router.get(
  '/class/:className',
  (req, res, next) => {
    console.log(`[ROUTE DEBUG] GET /class/${req.params.className} - Route hit`);
    console.log(`[ROUTE DEBUG] Params:`, req.params);
    console.log(`[ROUTE DEBUG] Query:`, req.query);
    console.log(`[ROUTE DEBUG] User:`, { userId: req.user?.userId, schoolCode: req.user?.schoolCode });
    next();
  },
  classSubjectsController.getSubjectsForClass
);

/**
 * Get Subjects by Grade and Section
 * GET /api/class-subjects/grade/:grade/section/:section
 * Query: academicYear?
 */
router.get(
  '/grade/:grade/section/:section',
  classSubjectsController.getSubjectsByGradeSection
);

/**
 * Update Subject in Class
 * PUT /api/class-subjects/update-subject
 * Body: { className, subjectName, teacherId?, teacherName?, subjectType? }
 */
router.put(
  '/update-subject',
  classSubjectsController.updateSubjectInClass
);

/**
 * Bulk Add Subjects to Class
 * POST /api/class-subjects/bulk-add
 * Body: { className, grade, section?, subjects: [{ name, type? }] }
 */
router.post(
  '/bulk-add',
  classSubjectsController.bulkAddSubjectsToClass
);

module.exports = router;
