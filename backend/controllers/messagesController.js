// backend/controllers/messagesController.js

const Message = require('../models/Message');
const User = require('../models/User');
const SchoolDatabaseManager = require('../utils/schoolDatabaseManager');

// Send message to students by class/section
exports.sendMessage = async (req, res) => {
  try {
    console.log('📨 Sending message:', req.body);
    
    // Validate required fields
    const { title, body, class: targetClass, section: targetSection } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required'
      });
    }

    // Verify school ownership - use schoolId from authenticated user
    const userSchoolId = req.user.schoolId;
    if (!userSchoolId) {
      return res.status(400).json({
        success: false,
        message: 'User school ID not found'
      });
    }

    console.log(`🔍 sendMessage: Using authenticated school ID: ${userSchoolId}`);
    
    // For admin users, they can only send messages to their own school (already enforced by userSchoolId)
    if (req.user.role === 'admin') {
        console.log(`✅ Admin user sending message to their school: ${userSchoolId}`);
    }
    
    // Get school connection for student queries
    const schoolCode = req.user.schoolCode;
    if (!schoolCode) {
      return res.status(400).json({
        success: false,
        message: 'School code not found in user profile'
      });
    }
    
    const connection = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    const db = connection.db;
    
    // Build student query to handle all possible data structures:
    // 1. class/section at root level (populateSchoolP.js)
    // 2. studentDetails.academic.currentClass/currentSection (quickPopulate.js)
    // 3. studentDetails.currentClass/currentSection (Excel import)
    const studentQuery = { 
      role: 'student',
      _placeholder: { $ne: true } // Exclude placeholder documents
    };
    
    // Build $or query to check all possible locations (case-insensitive)
    const classConditions = [];
    if (targetClass && targetClass !== 'ALL') {
      // Use regex for case-insensitive matching
      const classRegex = new RegExp(`^${targetClass}$`, 'i');
      classConditions.push(
        { class: classRegex },
        { 'studentDetails.academic.currentClass': classRegex },
        { 'studentDetails.currentClass': classRegex }
      );
    }
    
    const sectionConditions = [];
    if (targetSection && targetSection !== 'ALL') {
      // Use regex for case-insensitive matching
      const sectionRegex = new RegExp(`^${targetSection}$`, 'i');
      sectionConditions.push(
        { section: sectionRegex },
        { 'studentDetails.academic.currentSection': sectionRegex },
        { 'studentDetails.currentSection': sectionRegex }
      );
    }
    
    // Combine conditions
    if (classConditions.length > 0 && sectionConditions.length > 0) {
      studentQuery.$and = [
        { $or: classConditions },
        { $or: sectionConditions }
      ];
    } else if (classConditions.length > 0) {
      studentQuery.$or = classConditions;
    } else if (sectionConditions.length > 0) {
      studentQuery.$or = sectionConditions;
    }
    
    console.log('🔍 Student query:', JSON.stringify(studentQuery, null, 2));
    
    // Find matching students
    const studentsCollection = db.collection('students');
    const students = await studentsCollection.find(studentQuery).toArray();
    
    console.log(`👥 Found ${students.length} students matching criteria`);
    
    // Log sample student structure for debugging
    if (students.length > 0) {
      console.log('🔍 Sample student structure:', {
        class: students[0].class,
        section: students[0].section,
        academicClass: students[0].studentDetails?.academic?.currentClass,
        academicSection: students[0].studentDetails?.academic?.currentSection,
        currentClass: students[0].studentDetails?.currentClass,
        currentSection: students[0].studentDetails?.currentSection
      });
    } else {
      // Debug: Check total students in collection
      const totalStudents = await studentsCollection.countDocuments({ role: 'student' });
      console.log(`⚠️ No students found. Total students in collection: ${totalStudents}`);
      
      // Debug: Get sample student to see structure
      const sampleStudent = await studentsCollection.findOne({ role: 'student' });
      if (sampleStudent) {
        console.log('🔍 Sample student structure from DB:', {
          class: sampleStudent.class,
          section: sampleStudent.section,
          academicClass: sampleStudent.studentDetails?.academic?.currentClass,
          academicSection: sampleStudent.studentDetails?.academic?.currentSection,
          currentClass: sampleStudent.studentDetails?.currentClass,
          currentSection: sampleStudent.studentDetails?.currentSection,
          userId: sampleStudent.userId
        });
      }
    }
    
    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No students found matching the selected criteria'
      });
    }
    
    // Create message document
    const messageData = {
      schoolId: userSchoolId,
      createdBy: req.user._id,
      subject: title,
      content: body,
      messageType: 'general',
      priority: 'normal',
      status: 'sent',
      sentAt: new Date(),
      totalRecipients: students.length,
      // CONFIRMATION: The data is saved here under target.class and target.section
      target: {
        class: targetClass || 'ALL', 
        section: targetSection || 'ALL' 
      },
      sentTo: students.map(student => student._id),
      recipients: students.map(student => ({
        user: student._id,
        readAt: null
      })),
      readBy: new Map() // Initialize empty readBy map
    };
    
    console.log('✅ Message Data to be Saved:', {
        subject: messageData.subject,
        target: messageData.target, 
        totalRecipients: messageData.totalRecipients
    }); 
    
    // Save message to main database
    const message = new Message(messageData);
    await message.save();
    
    console.log(`✅ Message sent successfully to ${students.length} students`);
    
    // Dispatch background job for notifications (FCM, email, etc.)
    console.log('📱 Dispatching background notification job...');
    
    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: message._id,
        sentCount: students.length,
        recipients: students.map(s => ({
          id: s._id,
          name: s.name?.displayName || `${s.name?.firstName} ${s.name?.lastName}` || s.name,
          class: s.class || s.studentDetails?.academic?.currentClass || s.studentDetails?.currentClass,
          section: s.section || s.studentDetails?.academic?.currentSection || s.studentDetails?.currentSection
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// Preview message recipients count
exports.previewMessage = async (req, res) => {
  try {
    console.log('🔍 Previewing message recipients:', req.body);
    
    const { class: targetClass, section: targetSection } = req.body;
    
    // Get user's school ID from the authentication context (source of truth)
    const userSchoolId = req.user.schoolId;

    if (!userSchoolId) {
        return res.status(400).json({
            success: false,
            message: 'User school ID not found in authentication context'
        });
    }
    
    console.log(`🔍 previewMessage: Using authenticated school ID: ${userSchoolId}`);
    
    // For admin users, they can only preview messages for their own school (already enforced by userSchoolId)
    if (req.user.role === 'admin') {
        console.log(`✅ Admin user previewing recipients for their school: ${userSchoolId}`);
    }
    
    // Get school connection for student queries
    const schoolCode = req.user.schoolCode;
    if (!schoolCode) {
      return res.status(400).json({
        success: false,
        message: 'School code not found in user profile'
      });
    }
    
    const connection = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    const db = connection.db;
    
    // Build student query to handle all possible data structures (case-insensitive)
    const studentQuery = { 
      role: 'student',
      _placeholder: { $ne: true } // Exclude placeholder documents
    };
    
    // Build $or query to check all possible locations with case-insensitive matching
    const classConditions = [];
    if (targetClass && targetClass !== 'ALL') {
      // Use regex for case-insensitive matching
      const classRegex = new RegExp(`^${targetClass}$`, 'i');
      classConditions.push(
        { class: classRegex },
        { 'studentDetails.academic.currentClass': classRegex },
        { 'studentDetails.currentClass': classRegex }
      );
    }
    
    const sectionConditions = [];
    if (targetSection && targetSection !== 'ALL') {
      // Use regex for case-insensitive matching
      const sectionRegex = new RegExp(`^${targetSection}$`, 'i');
      sectionConditions.push(
        { section: sectionRegex },
        { 'studentDetails.academic.currentSection': sectionRegex },
        { 'studentDetails.currentSection': sectionRegex }
      );
    }
    
    // Combine conditions
    if (classConditions.length > 0 && sectionConditions.length > 0) {
      studentQuery.$and = [
        { $or: classConditions },
        { $or: sectionConditions }
      ];
    } else if (classConditions.length > 0) {
      studentQuery.$or = classConditions;
    } else if (sectionConditions.length > 0) {
      studentQuery.$or = sectionConditions;
    }
    
    console.log('🔍 Preview query:', JSON.stringify(studentQuery, null, 2));
    
    // Count matching students
    const studentsCollection = db.collection('students');
    const studentCount = await studentsCollection.countDocuments(studentQuery);
    
    // Get sample students for preview (limit to 10)
    const sampleStudents = await studentsCollection.find(studentQuery)
      .limit(10)
      .project({ 
        _id: 1, 
        'name.firstName': 1, 
        'name.lastName': 1, 
        'name.displayName': 1,
        class: 1, 
        section: 1 
      })
      .toArray();
    
    console.log(`👥 Found ${studentCount} students matching criteria`);
    
    res.json({
      success: true,
      data: {
        estimatedRecipients: studentCount,
        targetClass: targetClass || 'ALL',
        targetSection: targetSection || 'ALL',
        sampleRecipients: sampleStudents.map(s => ({
          id: s._id,
          name: s.name?.displayName || `${s.name?.firstName} ${s.name?.lastName}` || s.name,
          class: s.class || s.studentDetails?.academic?.currentClass || s.studentDetails?.currentClass,
          section: s.section || s.studentDetails?.academic?.currentSection || s.studentDetails?.currentSection
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Error previewing message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview message',
      error: error.message
    });
  }
};
// ... (rest of messagesController.js - getMessages, getMessageDetails, getMessageStats)
// ... (rest of messagesController.js - getMessages, getMessageDetails, getMessageStats)
// ... (rest of the file remains unchanged)
// ... (rest of the file remains unchanged)

// Get messages with filtering
exports.getMessages = async (req, res) => {
  try {
    console.log('📋 Fetching messages with filters:', req.query);
    
    const { 
      schoolId, 
      class: targetClass, 
      section: targetSection, 
      page = 1, 
      limit = 20,
      status = 'sent'
    } = req.query;
    
    // Build query
    const query = {
      schoolId: req.user.schoolId,
      status: status
    };
    
    // Filter by target class/section if specified
    if (targetClass && targetClass !== 'ALL') {
      query['target.class'] = targetClass;
    }
    
    if (targetSection && targetSection !== 'ALL') {
      query['target.section'] = targetSection;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const messages = await Message.find(query)
      .populate('sender', 'name email')
      .populate('createdBy', 'name email')
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalMessages = await Message.countDocuments(query);
    
    // Format response
    const formattedMessages = messages.map(message => ({
      id: message._id,
      title: message.subject,
      body: message.content,
      target: `${message.target?.class || 'ALL'} - ${message.target?.section || 'ALL'}`,
      sentAt: message.sentAt,
      recipientsCount: message.totalRecipients,
      readCount: message.readCount,
      status: message.status,
      sender: message.createdBy?.name?.displayName || 'Unknown',
      messageType: message.messageType,
      priority: message.priority
    }));
    
    res.json({
      success: true,
      data: {
        messages: formattedMessages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalMessages,
          pages: Math.ceil(totalMessages / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
};

// Get message details
exports.getMessageDetails = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId)
      .populate('sender', 'name email')
      .populate('createdBy', 'name email')
      .populate('recipients.user', 'name class section rollNumber');
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user has access to this message
    if (message.schoolId.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: message._id,
        title: message.subject,
        body: message.content,
        target: `${message.recipientGroups[0]?.value || 'ALL'} - ${message.recipientGroups[1]?.value || 'ALL'}`,
        sentAt: message.sentAt,
        recipientsCount: message.totalRecipients,
        readCount: message.readCount,
        status: message.status,
        sender: message.sender?.name?.displayName || 'Unknown',
        messageType: message.messageType,
        priority: message.priority,
        recipients: message.recipients.map(recipient => ({
          id: recipient.user._id,
          name: recipient.user.name?.displayName || `${recipient.user.name?.firstName} ${recipient.user.name?.lastName}`,
          class: recipient.user.class,
          section: recipient.user.section,
          rollNumber: recipient.user.rollNumber,
          readAt: recipient.readAt
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching message details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message details',
      error: error.message
    });
  }
};

// Get message statistics
exports.getMessageStats = async (req, res) => {
  try {
    const { schoolId } = req.query;
    
    const stats = await Message.aggregate([
      { $match: { schoolId: req.user.schoolId } },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          totalRecipients: { $sum: '$totalRecipients' },
          totalRead: { $sum: '$readCount' },
          avgReadRate: {
            $avg: {
              $cond: [
                { $gt: ['$totalRecipients', 0] },
                { $divide: ['$readCount', '$totalRecipients'] },
                0
              ]
            }
          }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalMessages: 0,
      totalRecipients: 0,
      totalRead: 0,
      avgReadRate: 0
    };
    
    res.json({
      success: true,
      data: {
        totalMessages: result.totalMessages,
        totalRecipients: result.totalRecipients,
        totalRead: result.totalRead,
        avgReadRate: Math.round(result.avgReadRate * 100) / 100
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching message stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message statistics',
      error: error.message
    });
  }
};
