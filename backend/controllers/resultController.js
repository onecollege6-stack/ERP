const Result = require('../models/Result');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const { gradeSystem, gradeUtils } = require('../utils/gradeSystem');

// Create or update student result with comprehensive grade calculation
exports.createOrUpdateResult = async (req, res) => {
  try {
    const {
      studentId,
      class: grade,
      section,
      academicYear,
      examType,
      subjects,
      overallGrade,
      remarks
    } = req.body;

    const schoolCode = req.user.schoolCode;
    const schoolId = req.user.schoolId;

    // Validate required fields
    if (!studentId || !grade || !section || !examType || !subjects || subjects.length === 0) {
      return res.status(400).json({
        message: 'Student ID, class, section, exam type, and subjects are required'
      });
    }

    // Validate student
    const student = await User.findOne({
      _id: studentId,
      role: 'student',
      schoolCode,
      isActive: true
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Validate class
    const classDoc = await Class.findOne({
      schoolCode,
      grade,
      section,
      academicYear: academicYear || '2024-25'
    });

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Get grade-specific grading system
    const gradingSystem = gradeUtils.getGradingSystem(grade);
    if (!gradingSystem) {
      return res.status(400).json({ message: 'Invalid grade level' });
    }

    // Process and validate subjects
    const processedSubjects = await processSubjectMarks(subjects, grade, gradingSystem, schoolCode);
    
    // Calculate overall statistics
    const overallStats = calculateOverallStatistics(processedSubjects, gradingSystem);

    // Find existing result or create new
    let result = await Result.findOne({
      schoolCode,
      studentId,
      academicYear: academicYear || '2024-25',
      'examDetails.examType': examType,
      'classDetails.grade': grade,
      'classDetails.section': section
    });

    const resultData = {
      schoolId,
      schoolCode,
      studentId,
      studentDetails: {
        studentName: `${student.name.firstName} ${student.name.lastName}`,
        rollNumber: student.studentDetails?.rollNumber || '',
        admissionNumber: student.studentDetails?.admissionNumber || '',
        parentName: student.parentDetails?.fatherName || '',
        parentContact: student.parentDetails?.mobileNumber || ''
      },
      classDetails: {
        grade,
        section,
        classSection: `${grade}${section}`,
        stream: classDoc.stream || null,
        academicYear: academicYear || '2024-25'
      },
      examDetails: {
        examType,
        examDate: new Date(),
        maxMarks: processedSubjects.reduce((sum, s) => sum + (s.maxMarks || 100), 0),
        resultDate: new Date()
      },
      subjects: processedSubjects,
      overallResult: {
        totalMarks: overallStats.totalMarks,
        maxMarks: overallStats.maxMarks,
        percentage: overallStats.percentage,
        grade: overallStats.grade,
        gradePoint: overallStats.gradePoint,
        status: overallStats.status,
        rank: null, // Will be calculated separately
        remarks: remarks || ''
      },
      gradingSystem: {
        type: gradingSystem.type,
        scale: gradingSystem.scale,
        grades: gradingSystem.grades
      },
      isActive: true,
      publishedAt: new Date(),
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    };

    if (result) {
      // Update existing result
      Object.assign(result, resultData);
      result.lastModified = new Date();
      await result.save();
    } else {
      // Create new result
      result = new Result(resultData);
      await result.save();
    }

    // Calculate rank among classmates
    await calculateClassRank(result, schoolCode, grade, section, examType, academicYear || '2024-25');

    res.status(result.isNew ? 201 : 200).json({
      success: true,
      message: result.isNew ? 'Result created successfully' : 'Result updated successfully',
      result: {
        id: result._id,
        resultId: result.resultId,
        studentName: result.studentDetails.studentName,
        classSection: result.classDetails.classSection,
        examType: result.examDetails.examType,
        percentage: result.overallResult.percentage,
        grade: result.overallResult.grade,
        status: result.overallResult.status,
        rank: result.overallResult.rank
      }
    });

  } catch (error) {
    console.error('Error creating/updating result:', error);
    res.status(500).json({ message: 'Error processing result', error: error.message });
  }
};

// Process subject marks with grade calculation
const processSubjectMarks = async (subjects, grade, gradingSystem, schoolCode) => {
  const processedSubjects = [];

  for (let subjectData of subjects) {
    const {
      subjectCode,
      marksObtained,
      maxMarks = 100,
      practicalMarks = 0,
      maxPracticalMarks = 0,
      isOptional = false
    } = subjectData;

    // Validate subject exists for the grade
    const subject = await Subject.findOne({
      schoolCode,
      subjectCode,
      'applicableGrades.grade': grade,
      isActive: true
    });

    if (!subject) {
      throw new Error(`Subject ${subjectCode} not found for grade ${grade}`);
    }

    // Calculate total marks
    const totalMarks = (marksObtained || 0) + (practicalMarks || 0);
    const totalMaxMarks = (maxMarks || 100) + (maxPracticalMarks || 0);
    const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;

    // Calculate grade using grading system
    const subjectGrade = calculateGrade(percentage, gradingSystem);

    processedSubjects.push({
      subjectCode,
      subjectName: subject.subjectName,
      subjectType: subject.subjectType,
      isOptional,
      theory: {
        marksObtained: marksObtained || 0,
        maxMarks: maxMarks || 100,
        percentage: maxMarks > 0 ? ((marksObtained || 0) / maxMarks) * 100 : 0
      },
      practical: {
        marksObtained: practicalMarks || 0,
        maxMarks: maxPracticalMarks || 0,
        percentage: maxPracticalMarks > 0 ? (practicalMarks / maxPracticalMarks) * 100 : 0
      },
      total: {
        marksObtained: totalMarks,
        maxMarks: totalMaxMarks,
        percentage: percentage,
        grade: subjectGrade.grade,
        gradePoint: subjectGrade.gradePoint,
        status: subjectGrade.status
      },
      teacherRemarks: subjectData.teacherRemarks || ''
    });
  }

  return processedSubjects;
};

// Calculate overall statistics
const calculateOverallStatistics = (subjects, gradingSystem) => {
  const totalMarks = subjects.reduce((sum, s) => sum + s.total.marksObtained, 0);
  const maxMarks = subjects.reduce((sum, s) => sum + s.total.maxMarks, 0);
  const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

  const overallGrade = calculateGrade(percentage, gradingSystem);

  return {
    totalMarks,
    maxMarks,
    percentage: Math.round(percentage * 100) / 100,
    grade: overallGrade.grade,
    gradePoint: overallGrade.gradePoint,
    status: overallGrade.status
  };
};

// Calculate grade based on percentage
const calculateGrade = (percentage, gradingSystem) => {
  for (let grade of gradingSystem.grades) {
    if (percentage >= grade.minPercentage && percentage <= grade.maxPercentage) {
      return {
        grade: grade.grade,
        gradePoint: grade.gradePoint,
        status: grade.grade === 'F' ? 'fail' : 'pass'
      };
    }
  }

  // Default to fail if no grade found
  return {
    grade: 'F',
    gradePoint: 0,
    status: 'fail'
  };
};

// Calculate class rank
const calculateClassRank = async (currentResult, schoolCode, grade, section, examType, academicYear) => {
  try {
    // Get all results for the same class, section, and exam
    const classResults = await Result.find({
      schoolCode,
      'classDetails.grade': grade,
      'classDetails.section': section,
      'examDetails.examType': examType,
      'classDetails.academicYear': academicYear,
      isActive: true
    }).sort({ 'overallResult.percentage': -1 });

    // Update ranks
    for (let i = 0; i < classResults.length; i++) {
      const result = classResults[i];
      result.overallResult.rank = i + 1;
      result.overallResult.totalStudents = classResults.length;
      await result.save();
    }

  } catch (error) {
    console.error('Error calculating class rank:', error);
  }
};

// Get student result history
exports.getStudentResultHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear, examType } = req.query;

    const schoolCode = req.user.schoolCode;

    // Build query
    const query = {
      schoolCode,
      studentId,
      isActive: true
    };

    if (academicYear) query['classDetails.academicYear'] = academicYear;
    if (examType) query['examDetails.examType'] = examType;

    const results = await Result.find(query)
      .sort({ 'examDetails.examDate': -1 })
      .select({
        resultId: 1,
        'classDetails.grade': 1,
        'classDetails.section': 1,
        'examDetails.examType': 1,
        'examDetails.examDate': 1,
        'overallResult.percentage': 1,
        'overallResult.grade': 1,
        'overallResult.status': 1,
        'overallResult.rank': 1,
        'overallResult.totalStudents': 1
      });

    // Calculate progress trend
    const progressTrend = calculateProgressTrend(results);

    res.json({
      success: true,
      studentId,
      resultCount: results.length,
      results,
      progressTrend
    });

  } catch (error) {
    console.error('Error fetching student result history:', error);
    res.status(500).json({ message: 'Error fetching result history', error: error.message });
  }
};

// Calculate progress trend
const calculateProgressTrend = (results) => {
  if (results.length < 2) return { trend: 'insufficient_data' };

  const latest = results[0];
  const previous = results[1];

  const improvement = latest.overallResult.percentage - previous.overallResult.percentage;

  return {
    trend: improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable',
    improvement: Math.round(improvement * 100) / 100,
    latestPercentage: latest.overallResult.percentage,
    previousPercentage: previous.overallResult.percentage
  };
};

// Generate class performance report
exports.generateClassPerformanceReport = async (req, res) => {
  try {
    const { grade, section } = req.params;
    const { academicYear, examType } = req.query;

    const schoolCode = req.user.schoolCode;

    // Get all results for the class
    const results = await Result.find({
      schoolCode,
      'classDetails.grade': grade,
      'classDetails.section': section,
      'classDetails.academicYear': academicYear || '2024-25',
      'examDetails.examType': examType,
      isActive: true
    }).populate('studentId', 'name');

    if (results.length === 0) {
      return res.status(404).json({ message: 'No results found for the specified criteria' });
    }

    // Calculate class statistics
    const classStats = calculateClassStatistics(results);

    // Generate subject-wise analysis
    const subjectAnalysis = generateSubjectAnalysis(results);

    // Find top performers
    const topPerformers = results
      .sort((a, b) => b.overallResult.percentage - a.overallResult.percentage)
      .slice(0, 5)
      .map(r => ({
        studentId: r.studentId._id,
        studentName: `${r.studentId.name.firstName} ${r.studentId.name.lastName}`,
        percentage: r.overallResult.percentage,
        grade: r.overallResult.grade,
        rank: r.overallResult.rank
      }));

    // Generate grade distribution
    const gradeDistribution = generateGradeDistribution(results);

    res.json({
      success: true,
      classDetails: {
        grade,
        section,
        academicYear: academicYear || '2024-25',
        examType,
        totalStudents: results.length
      },
      classStatistics: classStats,
      subjectAnalysis,
      topPerformers,
      gradeDistribution
    });

  } catch (error) {
    console.error('Error generating class performance report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
};

// Calculate class statistics
const calculateClassStatistics = (results) => {
  const percentages = results.map(r => r.overallResult.percentage);
  const total = percentages.reduce((sum, p) => sum + p, 0);
  
  return {
    averagePercentage: Math.round((total / percentages.length) * 100) / 100,
    highestPercentage: Math.max(...percentages),
    lowestPercentage: Math.min(...percentages),
    passCount: results.filter(r => r.overallResult.status === 'pass').length,
    failCount: results.filter(r => r.overallResult.status === 'fail').length,
    passPercentage: Math.round((results.filter(r => r.overallResult.status === 'pass').length / results.length) * 10000) / 100
  };
};

// Generate subject-wise analysis
const generateSubjectAnalysis = (results) => {
  const subjectStats = {};

  // Collect all subject data
  results.forEach(result => {
    result.subjects.forEach(subject => {
      if (!subjectStats[subject.subjectCode]) {
        subjectStats[subject.subjectCode] = {
          subjectName: subject.subjectName,
          subjectCode: subject.subjectCode,
          percentages: [],
          passCount: 0,
          failCount: 0
        };
      }

      subjectStats[subject.subjectCode].percentages.push(subject.total.percentage);
      if (subject.total.status === 'pass') {
        subjectStats[subject.subjectCode].passCount++;
      } else {
        subjectStats[subject.subjectCode].failCount++;
      }
    });
  });

  // Calculate statistics for each subject
  Object.keys(subjectStats).forEach(subjectCode => {
    const subject = subjectStats[subjectCode];
    const total = subject.percentages.reduce((sum, p) => sum + p, 0);
    
    subject.averagePercentage = Math.round((total / subject.percentages.length) * 100) / 100;
    subject.highestPercentage = Math.max(...subject.percentages);
    subject.lowestPercentage = Math.min(...subject.percentages);
    subject.passPercentage = Math.round((subject.passCount / subject.percentages.length) * 10000) / 100;
    
    // Remove raw percentages array
    delete subject.percentages;
  });

  return subjectStats;
};

// Generate grade distribution
const generateGradeDistribution = (results) => {
  const distribution = {};

  results.forEach(result => {
    const grade = result.overallResult.grade;
    distribution[grade] = (distribution[grade] || 0) + 1;
  });

  return distribution;
};

// Simple save results endpoint for the Results page
exports.saveResults = async (req, res) => {
  try {
    const {
      schoolCode,
      class: className,
      section,
      testType,
      maxMarks,
      academicYear,
      results
    } = req.body;

    console.log('💾 Saving results:', { schoolCode, className, section, testType, maxMarks, resultsCount: results?.length });

    if (!schoolCode || !className || !section || !testType || !results || !Array.isArray(results)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: schoolCode, class, section, testType, and results array'
      });
    }

    // Get school-specific database connection
    const DatabaseManager = require('../utils/databaseManager');
    const schoolConn = await DatabaseManager.getSchoolConnection(schoolCode);
    const resultsCollection = schoolConn.collection('results');

    // Prepare results data for storage
    const resultsToSave = results.map((result, index) => ({
      schoolCode: schoolCode.toUpperCase(),
      className,
      section,
      testType,
      maxMarks: parseInt(maxMarks),
      academicYear: academicYear || '2024-25',
      studentId: result.studentId,
      studentName: result.studentName,
      userId: result.userId,
      obtainedMarks: parseInt(result.obtainedMarks),
      totalMarks: parseInt(result.totalMarks),
      grade: result.grade,
      percentage: result.totalMarks > 0 ? Math.round((result.obtainedMarks / result.totalMarks) * 100 * 100) / 100 : 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user?._id || null
    }));

    // Insert results into school-specific collection
    const insertResult = await resultsCollection.insertMany(resultsToSave);

    console.log(`✅ Saved ${insertResult.insertedCount} results to school_${schoolCode.toLowerCase()}.results`);

    res.json({
      success: true,
      message: `Successfully saved ${insertResult.insertedCount} results`,
      data: {
        schoolCode,
        className,
        section,
        testType,
        savedCount: insertResult.insertedCount,
        results: resultsToSave.map(r => ({
          studentName: r.studentName,
          userId: r.userId,
          obtainedMarks: r.obtainedMarks,
          totalMarks: r.totalMarks,
          grade: r.grade,
          percentage: r.percentage
        }))
      }
    });

  } catch (error) {
    console.error('Error saving results:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving results',
      error: error.message
    });
  }
};

// Get existing results for a class and section
exports.getResults = async (req, res) => {
  try {
    const { schoolCode, class: className, section, testType, academicYear } = req.query;

    console.log('🔍 Fetching results:', { schoolCode, className, section, testType, academicYear });

    if (!schoolCode || !className || !section) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: schoolCode, class, and section'
      });
    }

    // Get school-specific database connection
    const DatabaseManager = require('../utils/databaseManager');
    const schoolConn = await DatabaseManager.getSchoolConnection(schoolCode);
    const resultsCollection = schoolConn.collection('results');

    // Build query
    const query = {
      schoolCode: schoolCode.toUpperCase(),
      className,
      section
    };

    if (testType) {
      query.testType = testType;
    }

    if (academicYear) {
      query.academicYear = academicYear;
    }

    // Fetch results from school-specific collection
    const results = await resultsCollection.find(query).sort({ createdAt: -1 }).toArray();

    console.log(`✅ Found ${results.length} results for ${className}-${section}`);

    res.json({
      success: true,
      message: `Found ${results.length} results`,
      data: results
    });

  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching results',
      error: error.message
    });
  }
};

module.exports = {
  createOrUpdateResult: exports.createOrUpdateResult,
  getStudentResultHistory: exports.getStudentResultHistory,
  generateClassPerformanceReport: exports.generateClassPerformanceReport,
  saveResults: exports.saveResults,
  getResults: exports.getResults
};
