const FeeStructure = require('../models/FeeStructure');
const StudentFeeRecord = require('../models/StudentFeeRecord');
const SchoolDatabaseManager = require('../utils/schoolDatabaseManager');
const { ObjectId } = require('mongodb');

// Create fee structure (per-school DB)
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
    
    // Per-school DB connection
    const schoolCode = req.user.schoolCode;
    const conn = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    const db = conn.db || conn;
    const feeStructuresCol = db.collection('feestructures');

    // Create fee structure in school DB
    const feeStructureData = {
      schoolId: new ObjectId(req.user.schoolId),
      createdBy: new ObjectId(req.user._id),
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
      status: 'active',
      appliedToStudents: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const insertRes = await feeStructuresCol.insertOne(feeStructureData);
    const feeStructure = { _id: insertRes.insertedId, ...feeStructureData };
    console.log(`✅ Fee structure created: ${feeStructure._id}`);
    
    // Apply to students if requested
    let appliedCount = 0;
    if (applyToStudents) {
      appliedCount = await applyFeeStructureToStudents_PerschoolDB(feeStructure, schoolCode);
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

// Apply fee structure to students (per-school DB)
async function applyFeeStructureToStudents_PerschoolDB(feeStructure, schoolCode) {
  try {
    const connection = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    const db = connection.db || connection;
    
    // Build student query (robust across possible schemas)
    const studentQueryBase = { 
      role: 'student',
      _placeholder: { $ne: true }
    };
    const andFilters = [];

    if (feeStructure.class !== 'ALL') {
      const cls = String(feeStructure.class).trim();
      andFilters.push({
        $or: [
          { class: cls },
          { studentClass: cls },
          { currentClass: cls },
          { 'studentDetails.currentClass': cls },
          // Also try numeric if possible
          ...(isNaN(Number(cls)) ? [] : [
            { class: Number(cls) },
            { studentClass: Number(cls) },
            { currentClass: Number(cls) },
          ])
        ]
      });
    }

    if (feeStructure.section !== 'ALL') {
      const sec = String(feeStructure.section).trim();
      const secUpper = sec.toUpperCase();
      const secLower = sec.toLowerCase();
      andFilters.push({
        $or: [
          { section: sec },
          { section: secUpper },
          { section: secLower },
          { studentSection: sec },
          { studentSection: secUpper },
          { studentSection: secLower },
          { currentSection: sec },
          { 'studentDetails.currentSection': sec }
        ]
      });
    }

    const studentQuery = andFilters.length > 0 
      ? { ...studentQueryBase, $and: andFilters }
      : studentQueryBase;

    console.log('[Fees] Applying to students with query:', JSON.stringify(studentQuery));
    
    // Find matching students
    const studentsCollection = db.collection('students');
    const students = await studentsCollection.find(studentQuery).toArray();
    
    console.log(`👥 Found ${students.length} students for fee structure application`);
    
    // Create student fee records
    const studentFeeRecords = students.map(student => ({
      schoolId: new ObjectId(feeStructure.schoolId),
      studentId: new ObjectId(student._id),
      feeStructureId: new ObjectId(feeStructure._id),
      studentName: student.name?.displayName || `${student.name?.firstName} ${student.name?.lastName}`,
      studentClass: student.class,
      studentSection: student.section,
      rollNumber: student.rollNumber,
      feeStructureName: feeStructure.name,
      academicYear: feeStructure.academicYear,
      totalAmount: feeStructure.totalAmount,
      installments: feeStructure.installments.map(inst => ({
        installmentId: new ObjectId(),
        name: inst.name,
        amount: inst.amount,
        dueDate: inst.dueDate,
        paidAmount: 0,
        status: 'pending',
        lateFeeAmount: inst.lateFeeAmount,
        remarks: ''
      })),
      payments: [],
      status: 'pending',
      totalPaid: 0,
      totalPending: feeStructure.totalAmount,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Bulk insert student fee records
    if (studentFeeRecords.length > 0) {
      const studentFeeCol = db.collection('studentfeerecords');
      await studentFeeCol.insertMany(studentFeeRecords);
      console.log(`✅ Created ${studentFeeRecords.length} student fee records`);
    }

    // Update fee structure with applied count in per-school DB
    const feeStructuresCol = db.collection('feestructures');
    await feeStructuresCol.updateOne(
      { _id: new ObjectId(feeStructure._id) },
      { $set: { appliedToStudents: students.length, updatedAt: new Date() } }
    );
    
    return students.length;
    
  } catch (error) {
    console.error('❌ Error applying fee structure to students:', error);
    throw error;
  }
}

// Get fee structures (per-school DB)
exports.getFeeStructures = async (req, res) => {
  try {
    const { class: targetClass, section: targetSection } = req.query;

    const schoolCode = req.user.schoolCode;
    const conn = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    const db = conn.db || conn;
    const feeStructuresCol = db.collection('feestructures');

    const query = {
      schoolId: new ObjectId(req.user.schoolId),
      isActive: true
    };
    if (targetClass && targetClass !== 'ALL') query.class = targetClass;
    if (targetSection && targetSection !== 'ALL') query.section = targetSection;

    const feeStructures = await feeStructuresCol
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({
      success: true,
      data: feeStructures.map(structure => ({
        id: structure._id,
        name: structure.name,
        description: structure.description,
        class: structure.class,
        section: structure.section,
        totalAmount: structure.totalAmount,
        installmentsCount: (structure.installments || []).length,
        academicYear: structure.academicYear,
        appliedToStudents: structure.appliedToStudents,
        status: structure.status,
        createdAt: structure.createdAt,
        createdBy: 'Admin'
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

// Get student fee records (per-school DB)
exports.getStudentFeeRecords = async (req, res) => {
  try {
    const { 
      class: targetClass, 
      section: targetSection, 
      page = 1, 
      limit = 20,
      search,
      status
    } = req.query;
    
    const schoolCode = req.user.schoolCode;
    const conn = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    const db = conn.db || conn;
    const studentFeeCol = db.collection('studentfeerecords');

    // Build query (robust matching for class/section)
    const query = { schoolId: new ObjectId(req.user.schoolId) };
    const andFilters = [];

    if (targetClass && targetClass !== 'ALL') {
      const clsRaw = String(targetClass).trim();
      const clsNumber = Number(clsRaw.replace(/[^0-9]/g, '')); // extract 7 from 'Class 7'
      const clsCandidate = (clsRaw.replace(/^class\s*/i, '').trim() || clsRaw);
      const clsRegex = new RegExp(`(^|\\b)(class\\s*)?${clsCandidate}(\\b|$)`, 'i');
      andFilters.push({
        $or: [
          // direct matches on primary field
          { studentClass: clsCandidate },
          // alternate field name that might exist in legacy docs
          { class: clsCandidate },
          // regex contains for both fields (handles 'Class 7', '7', 'Std 7')
          { studentClass: { $regex: clsRegex } },
          { class: { $regex: clsRegex } },
          // numeric coercion matches
          ...(isNaN(clsNumber) ? [] : [
            { studentClass: String(clsNumber) },
            { studentClass: clsNumber },
            { class: String(clsNumber) },
            { class: clsNumber },
          ])
        ]
      });
    }
    
    if (targetSection && targetSection !== 'ALL') {
      const sec = String(targetSection).trim();
      andFilters.push({
        $or: [
          { studentSection: { $regex: `^${sec}$`, $options: 'i' } },
          { section: { $regex: `^${sec}$`, $options: 'i' } }
        ]
      });
    }

    if (andFilters.length) {
      query.$and = andFilters;
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
    const cursor = studentFeeCol
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const records = await cursor.toArray();
    
    // Get total count for pagination
    const totalRecords = await studentFeeCol.countDocuments(query);
    
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

// Record offline payment (per-school DB)
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
    
    const schoolCode = req.user.schoolCode;
    const conn = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    const db = conn.db || conn;
    const studentFeeCol = db.collection('studentfeerecords');

    // Find student fee record
    const feeRecord = await studentFeeCol.findOne({
      studentId: new ObjectId(studentId),
      schoolId: new ObjectId(req.user.schoolId)
    });
    
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: 'Student fee record not found'
      });
    }
    
    // Check if installment exists
    const installment = (feeRecord.installments || []).find(inst => inst.name === installmentName);
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
      paymentId: new ObjectId(),
      installmentName,
      amount: parseFloat(amount),
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod,
      paymentReference: paymentReference || '',
      receivedBy: new ObjectId(req.user._id),
      remarks: remarks || '',
      receiptNumber,
      isVerified: false
    };
    
    // Push payment and recompute fields
    const updatedPayments = [...(feeRecord.payments || []), payment];

    // Recompute totals and installment statuses
    const totalPaid = updatedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPending = Math.max(0, (feeRecord.totalAmount || 0) - totalPaid);

    const installments = (feeRecord.installments || []).map(inst => {
      const paid = updatedPayments
        .filter(p => p.installmentName === inst.name)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      let status = 'pending';
      if (paid >= inst.amount) status = 'paid';
      else if (paid > 0) status = 'partial';
      else if (new Date() > new Date(inst.dueDate)) status = 'overdue';
      return { ...inst, paidAmount: paid, status };
    });

    // Overall status
    let status = 'pending';
    if (totalPaid >= (feeRecord.totalAmount || 0)) status = 'paid';
    else if (totalPaid > 0) status = 'partial';
    else if (installments.some(i => i.status === 'overdue')) status = 'overdue';

    // Overdue days and nextDueDate
    const overdueInst = installments.filter(i => i.status === 'overdue');
    let overdueDays = feeRecord.overdueDays || 0;
    if (overdueInst.length > 0) {
      const oldest = overdueInst.reduce((o, i) => (!o || new Date(i.dueDate) < new Date(o.dueDate) ? i : o), null);
      overdueDays = Math.max(0, Math.floor((Date.now() - new Date(oldest.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
    }
    const pendingInst = installments.filter(i => i.status === 'pending');
    const nextDueDate = pendingInst.length > 0
      ? pendingInst.reduce((n, i) => (!n || new Date(i.dueDate) < new Date(n.dueDate) ? i : n), null).dueDate
      : null;

    await studentFeeCol.updateOne(
      { _id: new ObjectId(feeRecord._id) },
      {
        $set: {
          payments: updatedPayments,
          installments,
          totalPaid,
          totalPending,
          status,
          overdueDays,
          nextDueDate,
          updatedAt: new Date(),
        }
      }
    );
    
    console.log(`✅ Payment recorded: ${receiptNumber}`);
    
    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        receiptNumber: payment.receiptNumber,
        paymentId: payment.paymentId,
        // Return recalculated values
        totalPaid,
        totalPending,
        status
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

// Get fee statistics (per-school DB)
exports.getFeeStats = async (req, res) => {
  try {
    const schoolCode = req.user.schoolCode;
    const conn = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    const db = conn.db || conn;
    const studentFeeCol = db.collection('studentfeerecords');

    // Get aggregated statistics
    const stats = await studentFeeCol.aggregate([
      { $match: { schoolId: new ObjectId(req.user.schoolId) } },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: '$totalAmount' },
          totalCollected: { $sum: '$totalPaid' },
          totalOutstanding: { $sum: '$totalPending' },
          totalRecords: { $sum: 1 },
          paidRecords: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          partialRecords: { $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] } },
          overdueRecords: { $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] } }
        }
      }
    ]).toArray();
    
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
