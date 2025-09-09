const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const assignmentController = require('../controllers/assignmentController');
const { auth, authorize } = require('../middleware/auth');

// Configure multer for assignment file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/assignments/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow documents, images, and other common file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only documents, images, and archives are allowed'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Apply authentication middleware to all routes
router.use(auth);

// Assignment management routes
router.post('/', upload.array('attachments', 5), authorize(['admin', 'teacher']), assignmentController.createAssignment);
router.get('/', assignmentController.getAssignments);
router.get('/stats', authorize(['admin', 'teacher']), assignmentController.getAssignmentStats);

// Assignment-specific routes
router.get('/:assignmentId', assignmentController.getAssignmentById);
router.put('/:assignmentId', authorize(['admin', 'teacher']), assignmentController.updateAssignment);
router.patch('/:assignmentId/publish', authorize(['admin', 'teacher']), assignmentController.publishAssignment);
router.delete('/:assignmentId', authorize(['admin', 'teacher']), assignmentController.deleteAssignment);

// Submission routes
router.post('/:assignmentId/submit', upload.array('attachments', 5), authorize(['student']), assignmentController.submitAssignment);
router.get('/:assignmentId/submission', assignmentController.getStudentSubmission);
router.get('/:assignmentId/submissions', authorize(['admin', 'teacher']), assignmentController.getAssignmentSubmissions);
router.put('/submissions/:submissionId/grade', authorize(['admin', 'teacher']), assignmentController.gradeSubmission);

module.exports = router;
