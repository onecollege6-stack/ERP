const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User = require('../models/User');
const School = require('../models/School');

// Create a new assignment
exports.createAssignment = async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      class: className,
      section,
      startDate,
      dueDate,
      instructions,
      academicYear,
      term,
      attachments = []
    } = req.body;

    // Validate required fields
    if (!title || !subject || !className || !section || !startDate || !dueDate) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        requiredFields: ['title', 'subject', 'class', 'section', 'startDate', 'dueDate']
      });
    }

    // Check if user is admin or teacher
    if (!['admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const schoolId = req.user.schoolId;
    
    // Get total students in the class
    const totalStudents = await User.countDocuments({
      schoolId,
      role: 'student',
      'studentDetails.class': className,
      'studentDetails.section': section
    });

    // Validate dates
    const startDateObj = new Date(startDate);
    const dueDateObj = new Date(dueDate);
    
    if (startDateObj >= dueDateObj) {
      return res.status(400).json({ message: 'Due date must be after start date' });
    }

    // Process uploaded files
    let processedAttachments = [];
    if (req.files && req.files.length > 0) {
      processedAttachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        uploadedAt: new Date()
      }));
    }

    // Create assignment
    const assignment = new Assignment({
      schoolId,
      title,
      description: description || instructions || '',
      subject,
      class: className,
      section,
      teacher: req.user._id,
      startDate: startDateObj,
      dueDate: dueDateObj,
      instructions: instructions || description || '',
      attachments: processedAttachments,
      academicYear: academicYear || '2024-25',
      term: term || 'Term 1',
      totalStudents,
      status: 'active',
      isPublished: true,
      publishedAt: new Date(),
      createdBy: req.user._id
    });

    await assignment.save();

    // Send notifications to students and parents
    try {
      await sendAssignmentNotifications(assignment, schoolId);
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError);
      // Don't fail the assignment creation if notifications fail
    }

    res.status(201).json({
      message: `Assignment sent to ${className} • Section ${section} • Due ${dueDateObj.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })}`,
      assignment: assignment.toObject(),
      summary: {
        studentsNotified: totalStudents,
        className: `${className} • Section ${section}`,
        dueDate: dueDateObj.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })
      }
    });

  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Error creating assignment', error: error.message });
  }
};

// Helper function to send notifications to students and parents
const sendAssignmentNotifications = async (assignment, schoolId) => {
  try {
    // Get all students in the class/section
    const students = await User.find({
      schoolId,
      role: 'student',
      'studentDetails.class': assignment.class,
      'studentDetails.section': assignment.section
    }).select('_id parentId fcmToken');

    // Get all parents of these students
    const parentIds = students.map(student => student.parentId).filter(Boolean);
    const parents = await User.find({
      _id: { $in: parentIds }
    }).select('_id fcmToken');

    // Create notification data
    const notificationData = {
      title: `New Assignment: ${assignment.subject}`,
      body: `${assignment.title} - Due: ${assignment.dueDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })}`,
      data: {
        type: 'assignment',
        assignmentId: assignment._id.toString(),
        subject: assignment.subject,
        className: assignment.class,
        section: assignment.section,
        dueDate: assignment.dueDate.toISOString()
      }
    };

    // Send to students
    const studentTokens = students.map(student => student.fcmToken).filter(Boolean);
    if (studentTokens.length > 0) {
      // Here you would integrate with your push notification service
      console.log(`📱 Sending notifications to ${studentTokens.length} students`);
    }

    // Send to parents
    const parentTokens = parents.map(parent => parent.fcmToken).filter(Boolean);
    if (parentTokens.length > 0) {
      // Here you would integrate with your push notification service
      console.log(`📱 Sending notifications to ${parentTokens.length} parents`);
    }

    return {
      studentsNotified: studentTokens.length,
      parentsNotified: parentTokens.length,
      totalNotified: studentTokens.length + parentTokens.length
    };

  } catch (error) {
    console.error('Error sending notifications:', error);
    throw error;
  }
};

// Get all assignments for a school
exports.getAssignments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, subject, class: className, search = '' } = req.query;

    // Check if user has access
    if (!['admin', 'teacher', 'student', 'parent'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const schoolId = req.user.schoolId;
    
    // Build query
    const query = { schoolId };
    if (status) {
      query.status = status;
    }
    if (subject) {
      query.subject = subject;
    }
    if (className) {
      query.class = className;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    // Teachers can only see their own assignments
    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    }

    // Students and parents can only see published assignments
    if (['student', 'parent'].includes(req.user.role)) {
      query.isPublished = true;
      query.status = 'active';
    }

    const assignments = await Assignment.find(query)
      .populate('teacher', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Assignment.countDocuments(query);

    res.json({
      assignments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
};

// Get assignment by ID
exports.getAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Check if user has access
    if (!['admin', 'teacher', 'student', 'parent'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assignment = await Assignment.findById(assignmentId)
      .populate('teacher', 'name email')
      .populate('createdBy', 'name email');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if user has access to this assignment's school
    if (req.user.schoolId?.toString() !== assignment.schoolId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Students and parents can only see published assignments
    if (['student', 'parent'].includes(req.user.role) && !assignment.isPublished) {
      return res.status(403).json({ message: 'Assignment not published yet' });
    }

    res.json(assignment);

  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ message: 'Error fetching assignment', error: error.message });
  }
};

// Update assignment
exports.updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const updateData = req.body;

    // Check if user is admin or teacher
    if (!['admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if user has access to this assignment's school
    if (req.user.schoolId?.toString() !== assignment.schoolId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Teachers can only update their own assignments
    if (req.user.role === 'teacher' && assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own assignments' });
    }

    // Remove sensitive fields from update
    delete updateData.schoolId;
    delete updateData.teacher;
    delete updateData.createdBy;

    updateData.updatedBy = req.user._id;
    updateData.updatedAt = new Date();

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('teacher', 'name email');

    res.json({ 
      message: 'Assignment updated successfully',
      assignment: updatedAssignment
    });

  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Error updating assignment', error: error.message });
  }
};

// Publish assignment
exports.publishAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Check if user is admin or teacher
    if (!['admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if user has access to this assignment's school
    if (req.user.schoolId?.toString() !== assignment.schoolId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Teachers can only publish their own assignments
    if (req.user.role === 'teacher' && assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only publish your own assignments' });
    }

    assignment.isPublished = true;
    assignment.publishedAt = new Date();
    assignment.status = 'active';
    assignment.updatedBy = req.user._id;
    assignment.updatedAt = new Date();

    await assignment.save();

    res.json({ 
      message: 'Assignment published successfully',
      assignment: {
        id: assignment._id,
        title: assignment.title,
        status: assignment.status,
        isPublished: assignment.isPublished
      }
    });

  } catch (error) {
    console.error('Error publishing assignment:', error);
    res.status(500).json({ message: 'Error publishing assignment', error: error.message });
  }
};

// Delete assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Check if user is admin or teacher
    if (!['admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if user has access to this assignment's school
    if (req.user.schoolId?.toString() !== assignment.schoolId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Teachers can only delete their own assignments
    if (req.user.role === 'teacher' && assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own assignments' });
    }

    await Assignment.findByIdAndDelete(assignmentId);

    res.json({ message: 'Assignment deleted successfully' });

  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Error deleting assignment', error: error.message });
  }
};

// Get assignment statistics
exports.getAssignmentStats = async (req, res) => {
  try {
    // Check if user has access
    if (!['admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const schoolId = req.user.schoolId;
    
    // Build match query
    const matchQuery = { schoolId };
    if (req.user.role === 'teacher') {
      matchQuery.teacher = req.user._id;
    }

    const stats = await Assignment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsObj = {};
    stats.forEach(stat => {
      statsObj[stat._id] = stat.count;
    });

    // Get overdue assignments count
    const overdueCount = await Assignment.countDocuments({
      ...matchQuery,
      dueDate: { $lt: new Date() },
      status: { $in: ['draft', 'active'] }
    });

    // Get assignments due this week
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const dueThisWeekCount = await Assignment.countDocuments({
      ...matchQuery,
      dueDate: { $gte: new Date(), $lte: weekFromNow },
      status: { $in: ['draft', 'active'] }
    });

    res.json({
      total: Object.values(statsObj).reduce((a, b) => a + b, 0),
      draft: statsObj.draft || 0,
      active: statsObj.active || 0,
      completed: statsObj.completed || 0,
      archived: statsObj.archived || 0,
      overdue: overdueCount,
      dueThisWeek: dueThisWeekCount
    });

  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    res.status(500).json({ message: 'Error fetching assignment stats', error: error.message });
  }
};

// Submit assignment (for students)
exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { submissionText } = req.body;

    // Check if user is student
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit assignments' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if student belongs to the assignment's class/section
    const student = req.user;
    if (student.studentDetails?.class !== assignment.class || 
        student.studentDetails?.section !== assignment.section) {
      return res.status(403).json({ message: 'Assignment not assigned to your class/section' });
    }

    // Check if assignment is still open for submissions
    const now = new Date();
    const isLate = now > assignment.dueDate;
    
    if (isLate && !assignment.allowLateSubmission) {
      return res.status(400).json({ message: 'Assignment submission deadline has passed' });
    }

    // Process uploaded files
    let processedAttachments = [];
    if (req.files && req.files.length > 0) {
      processedAttachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        uploadedAt: new Date()
      }));
    }

    // Check if student has already submitted
    const existingSubmission = await Submission.findOne({
      assignmentId,
      studentId: student._id
    });

    if (existingSubmission) {
      // Update existing submission (resubmission)
      existingSubmission.previousVersions.push({
        submissionText: existingSubmission.submissionText,
        attachments: existingSubmission.attachments,
        submittedAt: existingSubmission.submittedAt,
        version: existingSubmission.version
      });

      existingSubmission.submissionText = submissionText;
      existingSubmission.attachments = processedAttachments;
      existingSubmission.submittedAt = now;
      existingSubmission.isLateSubmission = isLate;
      existingSubmission.version += 1;
      existingSubmission.status = 'submitted';
      
      await existingSubmission.save();

      res.json({
        message: 'Assignment resubmitted successfully',
        submission: existingSubmission,
        isResubmission: true
      });
    } else {
      // Create new submission
      const submission = new Submission({
        schoolId: req.user.schoolId,
        assignmentId,
        studentId: student._id,
        submissionText,
        attachments: processedAttachments,
        isLateSubmission: isLate,
        maxMarks: assignment.maxMarks
      });

      await submission.save();

      // Update assignment submission count
      await Assignment.findByIdAndUpdate(assignmentId, {
        $inc: { submittedCount: 1 }
      });

      res.status(201).json({
        message: 'Assignment submitted successfully',
        submission: submission,
        isResubmission: false
      });
    }

  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ message: 'Error submitting assignment', error: error.message });
  }
};

// Get student's submission for an assignment
exports.getStudentSubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.role === 'student' ? req.user._id : req.query.studentId;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID required' });
    }

    const submission = await Submission.findOne({
      assignmentId,
      studentId
    }).populate('studentId', 'name studentDetails')
      .populate('gradedBy', 'name');

    if (!submission) {
      return res.status(404).json({ message: 'No submission found' });
    }

    res.json(submission);

  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ message: 'Error fetching submission', error: error.message });
  }
};

// Get all submissions for an assignment (for teachers)
exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { page = 1, limit = 10, status, search = '' } = req.query;

    // Check if user is admin or teacher
    if (!['admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Build query
    const query = { assignmentId };
    if (status) {
      query.status = status;
    }

    const submissions = await Submission.find(query)
      .populate('studentId', 'name studentDetails')
      .populate('gradedBy', 'name')
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Submission.countDocuments(query);

    res.json({
      submissions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });

  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};

// Grade a submission (for teachers)
exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback, maxMarks } = req.body;

    // Check if user is admin or teacher
    if (!['admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const submission = await Submission.findById(submissionId)
      .populate('assignmentId');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Validate grade
    const maxMarksToUse = maxMarks || submission.assignmentId.maxMarks;
    if (grade < 0 || grade > maxMarksToUse) {
      return res.status(400).json({ 
        message: `Grade must be between 0 and ${maxMarksToUse}` 
      });
    }

    // Update submission
    submission.grade = grade;
    submission.feedback = feedback;
    submission.maxMarks = maxMarksToUse;
    submission.status = 'graded';
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();

    await submission.save();

    // Update assignment graded count
    await Assignment.findByIdAndUpdate(submission.assignmentId._id, {
      $inc: { gradedCount: 1 }
    });

    res.json({
      message: 'Submission graded successfully',
      submission
    });

  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ message: 'Error grading submission', error: error.message });
  }
};
