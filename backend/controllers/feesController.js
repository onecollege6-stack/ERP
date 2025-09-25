const FeeStructure = require('../models/FeeStructure');
const StudentFeeRecord = require('../models/StudentFeeRecord');
const SchoolDatabaseManager = require('../utils/schoolDatabaseManager');

// Create fee structure
exports.createFeeStructure = async (req, res) => {
  try {
    console.log('💰 Creating fee structure:', req.body);
    
    const {
      name,
      description,
      class: targetClass,
      section = 'ALL',
      totalAmount,
      installments,
      academicYear,
      applyToStudents = false
    } = req.body;
    
    // Validate required fields
    if (!name || !targetClass || !totalAmount || !installments || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Name, class, total amount, installments, and academic year are required'
      });
    }
    
    // Validate installments
    if (!Array.isArray(installments) || installments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one installment is required'
      });
    }
    
    // Validate installment amounts sum to total
    const installmentsSum = installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
    if (Math.abs(installmentsSum - totalAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Sum of installment amounts must equal total amount'
      });
    }
    
    // Create fee structure
    const feeStructureData = {
      schoolId: req.user.schoolId,
      createdBy: req.user._id,
      name,
      description,
      class: targetClass,
      section,
      totalAmount,
      installments: installments.map(inst => ({
        name: inst.name,
        amount: inst.amount,
        dueDate: new Date(inst.dueDate),
        description: inst.description,
        isOptional: inst.isOptional || false,
        lateFeeAmount: inst.lateFeeAmount || 0,
        lateFeeAfter: inst.lateFeeAfter ? new Date(inst.lateFeeAfter) : null
      })),
      academicYear,
      isActive: true,
      status: 'active'
    };
    
    const feeStructure = new FeeStructure(feeStructureData);
    await feeStructure.save();
    
    console.log(`✅ Fee structure created: ${feeStructure._id}`);
    
    // Apply to students if requested
    let appliedCount = 0;
    if (applyToStudents) {
      appliedCount = await applyFeeStructureToStudents(feeStructure, req.user.schoolCode);
    }
    
    res.json({
      success: true,
      message: 'Fee structure created successfully',
      data: {
        feeStructureId: feeStructure._id,
        appliedToStudents: appliedCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating fee structure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create fee structure',
      error: error.message
    });
  }
};

// Apply fee structure to students
async function applyFeeStructureToStudents(feeStructure, schoolCode) {
  try {
    const connection = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    const db = connection.db;
    
    // Build student query
    const studentQuery = { 
      role: 'student',
      _placeholder: { $ne: true }
    };
    
    if (feeStructure.class !== 'ALL') {
      studentQuery.class = feeStructure.class;
    }
    
    if (feeStructure.section !== 'ALL') {
      studentQuery.section = feeStructure.section;
    }
    
    // Find matching students
    const studentsCollection = db.collection('students');
    const students = await studentsCollection.find(studentQuery).toArray();
    
    console.log(`👥 Found ${students.length} students for fee structure application`);
    
    // Create student fee records
    const studentFeeRecords = students.map(student => ({
      schoolId: feeStructure.schoolId,
      studentId: student._id,
      feeStructureId: feeStructure._id,
      studentName: student.name?.displayName || `${student.name?.firstName} ${student.name?.lastName}`,
      studentClass: student.class,
      studentSection: student.section,
      rollNumber: student.rollNumber,
      feeStructureName: feeStructure.name,
      academicYear: feeStructure.academicYear,
      totalAmount: feeStructure.totalAmount,
      installments: feeStructure.installments.map(inst => ({
        installmentId: new require('mongoose').Types.ObjectId(),
        name: inst.name,
        amount: inst.amount,
        dueDate: inst.dueDate,
        paidAmount: 0,
        status: 'pending',
        lateFeeAmount: inst.lateFeeAmount,
        remarks: ''
      }))
    }));
    
    // Bulk insert student fee records
    if (studentFeeRecords.length > 0) {
      await StudentFeeRecord.insertMany(studentFeeRecords);
      console.log(`✅ Created ${studentFeeRecords.length} student fee records`);
    }
    
    // Update fee structure with applied count
    feeStructure.appliedToStudents = students.length;
    await feeStructure.save();
    
    return students.length;
    
  } catch (error) {
    console.error('❌ Error applying fee structure to students:', error);
    throw error;
  }
}

// Get fee structures
exports.getFeeStructures = async (req, res) => {
  try {
    const { schoolId, class: targetClass, section: targetSection } = req.query;
    
    const query = {
      schoolId: req.user.schoolId,
      isActive: true
    };
    
    if (targetClass && targetClass !== 'ALL') {
      query.class = targetClass;
    }
    
    if (targetSection && targetSection !== 'ALL') {
      query.section = targetSection;
    }
    
    const feeStructures = await FeeStructure.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: feeStructures.map(structure => ({
        id: structure._id,
        name: structure.name,
        description: structure.description,
        class: structure.class,
        section: structure.section,
        totalAmount: structure.totalAmount,
        installmentsCount: structure.installments.length,
        academicYear: structure.academicYear,
        appliedToStudents: structure.appliedToStudents,
        status: structure.status,
        createdAt: structure.createdAt,
        createdBy: structure.createdBy?.name?.displayName || 'Unknown'
      }))
    });
    
  } catch (error) {
    console.error('❌ Error fetching fee structures:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee structures',
      error: error.message
    });
  }
};

// Get student fee records
exports.getStudentFeeRecords = async (req, res) => {
  try {
    const { 
      schoolId, 
      class: targetClass, 
      section: targetSection, 
      page = 1, 
      limit = 20,
      search,
      status
    } = req.query;
    
    // Build query
    const query = {
      schoolId: req.user.schoolId
    };
    
    if (targetClass && targetClass !== 'ALL') {
      query.studentClass = targetClass;
    }
    
    if (targetSection && targetSection !== 'ALL') {
      query.studentSection = targetSection;
    }
    
    if (status && status !== 'ALL') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { feeStructureName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const records = await StudentFeeRecord.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalRecords = await StudentFeeRecord.countDocuments(query);
    
    // Format response
    const formattedRecords = records.map(record => ({
      id: record._id,
      studentId: record.studentId,
      studentName: record.studentName,
      studentClass: record.studentClass,
      studentSection: record.studentSection,
      rollNumber: record.rollNumber,
      feeStructureName: record.feeStructureName,
      totalAmount: record.totalAmount,
      totalPaid: record.totalPaid,
      totalPending: record.totalPending,
      status: record.status,
      paymentPercentage: record.paymentPercentage,
      nextDueDate: record.nextDueDate,
      overdueDays: record.overdueDays
    }));
    
    res.json({
      success: true,
      data: {
        records: formattedRecords,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalRecords,
          pages: Math.ceil(totalRecords / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching student fee records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student fee records',
      error: error.message
    });
  }
};

// Record offline payment
exports.recordOfflinePayment = async (req, res) => {
  try {
    console.log('💳 Recording offline payment:', req.body);
    
    const { studentId } = req.params;
    const {
      installmentName,
      amount,
      paymentDate,
      paymentMethod,
      paymentReference,
      remarks
    } = req.body;
    
    // Validate required fields
    if (!installmentName || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Installment name, amount, and payment method are required'
      });
    }
    
    // Find student fee record
    const feeRecord = await StudentFeeRecord.findOne({
      studentId,
      schoolId: req.user.schoolId
    });
    
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: 'Student fee record not found'
      });
    }
    
    // Check if installment exists
    const installment = feeRecord.installments.find(inst => inst.name === installmentName);
    if (!installment) {
      return res.status(400).json({
        success: false,
        message: 'Installment not found in fee structure'
      });
    }
    
    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Create payment record
    const payment = {
      paymentId: new require('mongoose').Types.ObjectId(),
      installmentName,
      amount: parseFloat(amount),
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod,
      paymentReference: paymentReference || '',
      receivedBy: req.user._id,
      remarks: remarks || '',
      receiptNumber,
      isVerified: false
    };
    
    // Add payment to record
    feeRecord.payments.push(payment);
    
    // Save the updated record (this will trigger pre-save middleware to update totals)
    await feeRecord.save();
    
    console.log(`✅ Payment recorded: ${receiptNumber}`);
    
    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        receiptNumber: payment.receiptNumber,
        paymentId: payment.paymentId,
        totalPaid: feeRecord.totalPaid,
        totalPending: feeRecord.totalPending,
        status: feeRecord.status
      }
    });
    
  } catch (error) {
    console.error('❌ Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  }
};

// Get fee statistics
exports.getFeeStats = async (req, res) => {
  try {
    const { schoolId } = req.query;
    
    // Get aggregated statistics
    const stats = await StudentFeeRecord.aggregate([
      { $match: { schoolId: req.user.schoolId } },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: '$totalAmount' },
          totalCollected: { $sum: '$totalPaid' },
          totalOutstanding: { $sum: '$totalPending' },
          totalRecords: { $sum: 1 },
          paidRecords: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, 1, 0]
            }
          },
          partialRecords: {
            $sum: {
              $cond: [{ $eq: ['$status', 'partial'] }, 1, 0]
            }
          },
          overdueRecords: {
            $sum: {
              $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalBilled: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      totalRecords: 0,
      paidRecords: 0,
      partialRecords: 0,
      overdueRecords: 0
    };
    
    const collectionPercentage = result.totalBilled > 0 
      ? Math.round((result.totalCollected / result.totalBilled) * 100) 
      : 0;
    
    res.json({
      success: true,
      data: {
        totalBilled: result.totalBilled,
        totalCollected: result.totalCollected,
        totalOutstanding: result.totalOutstanding,
        collectionPercentage,
        totalRecords: result.totalRecords,
        paidRecords: result.paidRecords,
        partialRecords: result.partialRecords,
        overdueRecords: result.overdueRecords
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching fee stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee statistics',
      error: error.message
    });
  }
};
