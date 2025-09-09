const mongoose = require('mongoose');

const testTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  maxMarks: {
    type: Number,
    default: 100
  },
  weightage: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const testDetailsSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  schoolCode: {
    type: String,
    required: true,
    uppercase: true
  },
  academicYear: {
    type: String,
    required: true,
    default: '2024-25'
  },
  testTypes: [testTypeSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Pre-save middleware to update the updatedAt field
testDetailsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create default test types for new schools
testDetailsSchema.statics.createDefaultTestTypes = function(schoolId, schoolCode, createdBy) {
  const defaultTestTypes = [
    { name: 'Formative Assessment 1', code: 'FA-1', description: 'First Formative Assessment', maxMarks: 20, weightage: 0.1 },
    { name: 'Formative Assessment 2', code: 'FA-2', description: 'Second Formative Assessment', maxMarks: 20, weightage: 0.1 },
    { name: 'Formative Assessment 3', code: 'FA-3', description: 'Third Formative Assessment', maxMarks: 20, weightage: 0.1 },
    { name: 'Formative Assessment 4', code: 'FA-4', description: 'Fourth Formative Assessment', maxMarks: 20, weightage: 0.1 },
    { name: 'Summative Assessment 1', code: 'SA-1', description: 'First Summative Assessment', maxMarks: 80, weightage: 0.3 },
    { name: 'Summative Assessment 2', code: 'SA-2', description: 'Second Summative Assessment', maxMarks: 80, weightage: 0.3 },
    { name: 'Final Examination', code: 'FINAL', description: 'Final Examination', maxMarks: 100, weightage: 1.0 },
    { name: 'Unit Test 1', code: 'UT-1', description: 'First Unit Test', maxMarks: 25, weightage: 0.15 },
    { name: 'Unit Test 2', code: 'UT-2', description: 'Second Unit Test', maxMarks: 25, weightage: 0.15 },
    { name: 'Half Yearly', code: 'HY', description: 'Half Yearly Examination', maxMarks: 100, weightage: 0.5 },
    { name: 'Annual Examination', code: 'ANNUAL', description: 'Annual Examination', maxMarks: 100, weightage: 0.5 }
  ];

  return this.create({
    schoolId,
    schoolCode,
    testTypes: defaultTestTypes,
    createdBy
  });
};

module.exports = mongoose.model('TestDetails', testDetailsSchema);
