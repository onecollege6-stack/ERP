const SchoolDatabaseManager = require('../utils/schoolDatabaseManager');

class ReportService {
  // Get comprehensive school summary with KPIs
  async getSchoolSummary(schoolId, schoolCode, filters = {}) {
    try {
      const connection = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
      const db = connection.db;

      const { from, to, class: targetClass, section: targetSection } = filters;

      // Build base query for students
      const studentQuery = { 
        role: 'student',
        _placeholder: { $ne: true }
      };

      if (targetClass && targetClass !== 'ALL') {
        studentQuery.class = targetClass;
      }
      if (targetSection && targetSection !== 'ALL') {
        studentQuery.section = targetSection;
      }

      // Get student count
      const studentsCollection = db.collection('students');
      const totalStudents = await studentsCollection.countDocuments(studentQuery);

      // Get classes count
      const classesCollection = db.collection('classes');
      const classesQuery = { isActive: true };
      if (targetClass && targetClass !== 'ALL') {
        classesQuery.className = targetClass;
      }
      const classesCount = await classesCollection.countDocuments(classesQuery);

      // Calculate average attendance
      const attendanceCollection = db.collection('attendance');
      const attendanceQuery = { studentId: { $exists: true } };
      if (from) attendanceQuery.date = { $gte: new Date(from) };
      if (to) attendanceQuery.date = { ...attendanceQuery.date, $lte: new Date(to) };

      const attendanceStats = await attendanceCollection.aggregate([
        { $match: attendanceQuery },
        {
          $group: {
            _id: '$studentId',
            totalDays: { $sum: 1 },
            presentDays: {
              $sum: {
                $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            avgAttendance: {
              $avg: {
                $cond: [
                  { $gt: ['$totalDays', 0] },
                  { $multiply: [{ $divide: ['$presentDays', '$totalDays'] }, 100] },
                  0
                ]
              }
            }
          }
        }
      ]).toArray();

      const avgAttendance = attendanceStats[0]?.avgAttendance || 0;

      // Get fee statistics
      const FeeStructure = require('../models/FeeStructure');
      const StudentFeeRecord = require('../models/StudentFeeRecord');

      const feeQuery = { schoolId };
      if (targetClass && targetClass !== 'ALL') {
        feeQuery.class = targetClass;
      }
      if (targetSection && targetSection !== 'ALL') {
        feeQuery.section = targetSection;
      }

      const feeStats = await StudentFeeRecord.aggregate([
        { $match: feeQuery },
        {
          $group: {
            _id: null,
            totalFeesAssigned: { $sum: '$totalAmount' },
            totalFeesCollected: { $sum: '$totalPaid' },
            outstanding: { $sum: '$totalPending' }
          }
        }
      ]).toArray();

      const feeResult = feeStats[0] || {
        totalFeesAssigned: 0,
        totalFeesCollected: 0,
        outstanding: 0
      };

      // Get average marks (if results exist)
      const resultsCollection = db.collection('results');
      const resultsQuery = {};
      if (from) resultsQuery.createdAt = { $gte: new Date(from) };
      if (to) resultsQuery.createdAt = { ...resultsQuery.createdAt, $lte: new Date(to) };

      const marksStats = await resultsCollection.aggregate([
        { $match: resultsQuery },
        {
          $group: {
            _id: null,
            avgMarks: { $avg: '$percentage' },
            totalResults: { $sum: 1 }
          }
        }
      ]).toArray();

      const avgMarks = marksStats[0]?.avgMarks || 0;

      return {
        totalStudents,
        classesCount,
        avgAttendance: Math.round(avgAttendance * 100) / 100,
        totalFeesAssigned: feeResult.totalFeesAssigned,
        totalFeesCollected: feeResult.totalFeesCollected,
        outstanding: feeResult.outstanding,
        collectionPercentage: feeResult.totalFeesAssigned > 0 
          ? Math.round((feeResult.totalFeesCollected / feeResult.totalFeesAssigned) * 100)
          : 0,
        avgMarks: Math.round(avgMarks * 100) / 100
      };
    } catch (error) {
      console.error('Error generating school summary:', error);
      throw error;
    }
  }

  // Get class-wise summary
  async getClassSummary(schoolId, schoolCode, filters = {}) {
    try {
      const connection = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
      const db = connection.db;

      const { from, to } = filters;

      // Get all classes
      const classesCollection = db.collection('classes');
      const classes = await classesCollection.find({ isActive: true }).toArray();

      const classSummaries = [];

      for (const cls of classes) {
        const studentQuery = { 
          role: 'student',
          class: cls.className,
          _placeholder: { $ne: true }
        };

        // Student count
        const studentsCollection = db.collection('students');
        const studentCount = await studentsCollection.countDocuments(studentQuery);

        // Average attendance for this class
        const attendanceCollection = db.collection('attendance');
        const attendanceQuery = { 
          studentId: { $exists: true },
          class: cls.className
        };
        if (from) attendanceQuery.date = { $gte: new Date(from) };
        if (to) attendanceQuery.date = { ...attendanceQuery.date, $lte: new Date(to) };

        const classAttendanceStats = await attendanceCollection.aggregate([
          { $match: attendanceQuery },
          {
            $group: {
              _id: '$studentId',
              totalDays: { $sum: 1 },
              presentDays: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
                }
              }
            }
          },
          {
            $group: {
              _id: null,
              avgAttendance: {
                $avg: {
                  $cond: [
                    { $gt: ['$totalDays', 0] },
                    { $multiply: [{ $divide: ['$presentDays', '$totalDays'] }, 100] },
                    0
                  ]
                }
              }
            }
          }
        ]).toArray();

        const avgAttendance = classAttendanceStats[0]?.avgAttendance || 0;

        // Average marks for this class
        const resultsCollection = db.collection('results');
        const resultsQuery = { class: cls.className };
        if (from) resultsQuery.createdAt = { $gte: new Date(from) };
        if (to) resultsQuery.createdAt = { ...resultsQuery.createdAt, $lte: new Date(to) };

        const classMarksStats = await resultsCollection.aggregate([
          { $match: resultsQuery },
          {
            $group: {
              _id: null,
              avgMarks: { $avg: '$percentage' },
              totalResults: { $sum: 1 }
            }
          }
        ]).toArray();

        const avgMarks = classMarksStats[0]?.avgMarks || 0;

        // Fee statistics for this class
        const StudentFeeRecord = require('../models/StudentFeeRecord');
        const classFeeStats = await StudentFeeRecord.aggregate([
          { $match: { schoolId, studentClass: cls.className } },
          {
            $group: {
              _id: null,
              totalFeesAssigned: { $sum: '$totalAmount' },
              totalFeesCollected: { $sum: '$totalPaid' },
              outstanding: { $sum: '$totalPending' }
            }
          }
        ]).toArray();

        const feeResult = classFeeStats[0] || {
          totalFeesAssigned: 0,
          totalFeesCollected: 0,
          outstanding: 0
        };

        classSummaries.push({
          classId: cls._id,
          className: cls.className,
          sections: cls.sections || [],
          studentCount,
          avgAttendance: Math.round(avgAttendance * 100) / 100,
          avgMarks: Math.round(avgMarks * 100) / 100,
          totalFeesAssigned: feeResult.totalFeesAssigned,
          totalFeesCollected: feeResult.totalFeesCollected,
          outstanding: feeResult.outstanding,
          collectionPercentage: feeResult.totalFeesAssigned > 0 
            ? Math.round((feeResult.totalFeesCollected / feeResult.totalFeesAssigned) * 100)
            : 0
        });
      }

      return classSummaries;
    } catch (error) {
      console.error('Error generating class summary:', error);
      throw error;
    }
  }

  // Get detailed student data for a class
  async getClassDetail(schoolId, schoolCode, className, section, filters = {}) {
    try {
      const connection = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
      const db = connection.db;

      const { from, to, page = 1, limit = 50, search } = filters;
      const skip = (page - 1) * limit;

      // Build student query
      const studentQuery = { 
        role: 'student',
        class: className,
        _placeholder: { $ne: true }
      };

      if (section && section !== 'ALL') {
        studentQuery.section = section;
      }

      if (search) {
        studentQuery.$or = [
          { 'name.firstName': { $regex: search, $options: 'i' } },
          { 'name.lastName': { $regex: search, $options: 'i' } },
          { 'name.displayName': { $regex: search, $options: 'i' } },
          { rollNumber: { $regex: search, $options: 'i' } }
        ];
      }

      // Get students with pagination
      const studentsCollection = db.collection('students');
      const students = await studentsCollection
        .find(studentQuery)
        .skip(skip)
        .limit(limit)
        .toArray();

      const totalStudents = await studentsCollection.countDocuments(studentQuery);

      // Get additional data for each student
      const studentsWithDetails = await Promise.all(
        students.map(async (student) => {
          // Get attendance percentage
          const attendanceCollection = db.collection('attendance');
          const attendanceQuery = { studentId: student._id };
          if (from) attendanceQuery.date = { $gte: new Date(from) };
          if (to) attendanceQuery.date = { ...attendanceQuery.date, $lte: new Date(to) };

          const attendanceStats = await attendanceCollection.aggregate([
            { $match: attendanceQuery },
            {
              $group: {
                _id: null,
                totalDays: { $sum: 1 },
                presentDays: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
                  }
                }
              }
            }
          ]).toArray();

          const attendancePercentage = attendanceStats[0] 
            ? Math.round((attendanceStats[0].presentDays / attendanceStats[0].totalDays) * 100)
            : 0;

          // Get latest results
          const resultsCollection = db.collection('results');
          const latestResult = await resultsCollection
            .findOne(
              { studentId: student._id },
              { sort: { createdAt: -1 } }
            );

          // Get fee status
          const StudentFeeRecord = require('../models/StudentFeeRecord');
          const feeRecord = await StudentFeeRecord.findOne({
            schoolId,
            studentId: student._id
          });

          // Get unread messages count
          const Message = require('../models/Message');
          const unreadMessagesCount = await Message.countDocuments({
            schoolId,
            sentTo: student._id,
            [`readBy.${student._id}`]: { $exists: false }
          });

          return {
            ...student,
            attendancePercentage,
            latestResult: latestResult ? {
              percentage: latestResult.percentage,
              grade: latestResult.grade,
              term: latestResult.term,
              createdAt: latestResult.createdAt
            } : null,
            feeStatus: feeRecord ? {
              totalAmount: feeRecord.totalAmount,
              totalPaid: feeRecord.totalPaid,
              balance: feeRecord.totalPending,
              status: feeRecord.status
            } : null,
            unreadMessagesCount
          };
        })
      );

      return {
        students: studentsWithDetails,
        pagination: {
          page,
          limit,
          total: totalStudents,
          pages: Math.ceil(totalStudents / limit)
        }
      };
    } catch (error) {
      console.error('Error getting class detail:', error);
      throw error;
    }
  }

  // Get full student profile
  async getStudentProfile(schoolId, schoolCode, studentId) {
    try {
      const connection = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
      const db = connection.db;

      // Get student basic info
      const studentsCollection = db.collection('students');
      const student = await studentsCollection.findOne({ _id: studentId });

      if (!student) {
        throw new Error('Student not found');
      }

      // Get attendance timeline
      const attendanceCollection = db.collection('attendance');
      const attendanceTimeline = await attendanceCollection
        .find({ studentId })
        .sort({ date: -1 })
        .limit(30)
        .toArray();

      // Get results history
      const resultsCollection = db.collection('results');
      const resultsHistory = await resultsCollection
        .find({ studentId })
        .sort({ createdAt: -1 })
        .toArray();

      // Get payment history
      const StudentFeeRecord = require('../models/StudentFeeRecord');
      const feeRecord = await StudentFeeRecord.findOne({
        schoolId,
        studentId
      });

      // Get messages
      const Message = require('../models/Message');
      const messages = await Message.find({
        schoolId,
        sentTo: studentId
      }).sort({ createdAt: -1 }).limit(20);

      return {
        student,
        attendanceTimeline,
        resultsHistory,
        paymentHistory: feeRecord?.payments || [],
        messages: messages.map(msg => ({
          id: msg._id,
          title: msg.subject,
          content: msg.content,
          sentAt: msg.sentAt,
          readAt: msg.readBy?.get(studentId.toString())
        }))
      };
    } catch (error) {
      console.error('Error getting student profile:', error);
      throw error;
    }
  }

  // Export data to CSV
  async exportToCSV(schoolId, schoolCode, exportType, filters = {}) {
    try {
      const connection = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
      const db = connection.db;

      const { class: targetClass, section: targetSection, from, to } = filters;

      let data = [];
      let headers = [];

      switch (exportType) {
        case 'students':
          const studentQuery = { 
            role: 'student',
            _placeholder: { $ne: true }
          };
          if (targetClass && targetClass !== 'ALL') studentQuery.class = targetClass;
          if (targetSection && targetSection !== 'ALL') studentQuery.section = targetSection;

          const students = await db.collection('students').find(studentQuery).toArray();
          
          headers = ['Name', 'Class', 'Section', 'Roll Number', 'Email', 'Phone'];
          data = students.map(student => [
            student.name?.displayName || `${student.name?.firstName} ${student.name?.lastName}`,
            student.class,
            student.section,
            student.rollNumber || '',
            student.email || '',
            student.contact?.primaryPhone || ''
          ]);
          break;

        case 'attendance':
          const attendanceQuery = { studentId: { $exists: true } };
          if (from) attendanceQuery.date = { $gte: new Date(from) };
          if (to) attendanceQuery.date = { ...attendanceQuery.date, $lte: new Date(to) };
          if (targetClass && targetClass !== 'ALL') attendanceQuery.class = targetClass;
          if (targetSection && targetSection !== 'ALL') attendanceQuery.section = targetSection;

          const attendanceRecords = await db.collection('attendance').find(attendanceQuery).toArray();
          
          headers = ['Student Name', 'Class', 'Section', 'Date', 'Status'];
          data = await Promise.all(attendanceRecords.map(async (record) => {
            const student = await db.collection('students').findOne({ _id: record.studentId });
            return [
              student?.name?.displayName || 'Unknown',
              record.class,
              record.section,
              record.date,
              record.status
            ];
          }));
          break;

        case 'results':
          const resultsQuery = {};
          if (from) resultsQuery.createdAt = { $gte: new Date(from) };
          if (to) resultsQuery.createdAt = { ...resultsQuery.createdAt, $lte: new Date(to) };
          if (targetClass && targetClass !== 'ALL') resultsQuery.class = targetClass;
          if (targetSection && targetSection !== 'ALL') resultsQuery.section = targetSection;

          const results = await db.collection('results').find(resultsQuery).toArray();
          
          headers = ['Student Name', 'Class', 'Section', 'Term', 'Percentage', 'Grade'];
          data = await Promise.all(results.map(async (result) => {
            const student = await db.collection('students').findOne({ _id: result.studentId });
            return [
              student?.name?.displayName || 'Unknown',
              result.class,
              result.section,
              result.term,
              result.percentage,
              result.grade
            ];
          }));
          break;
      }

      // Convert to CSV format
      const csvContent = [
        headers.join(','),
        ...data.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }
}

module.exports = new ReportService();
