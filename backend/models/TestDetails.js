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
  // Map of class name to array of test types
  classTestTypes: {
    type: Map,
    of: [testTypeSchema],
    default: {}
  },
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
    { name: 'Formative Assessment 1', code: 'FA-1', description: 'First Formative Assessment', maxMarks: 20, weightage: 0.1, isActive: true },
    { name: 'Formative Assessment 2', code: 'FA-2', description: 'Second Formative Assessment', maxMarks: 20, weightage: 0.1, isActive: true },
    { name: 'Midterm Examination', code: 'MIDTERM', description: 'Midterm Examination', maxMarks: 80, weightage: 0.3, isActive: true },
    { name: 'Summative Assessment 1', code: 'SA-1', description: 'First Summative Assessment', maxMarks: 80, weightage: 0.3, isActive: true },
    { name: 'Summative Assessment 2', code: 'SA-2', description: 'Second Summative Assessment', maxMarks: 80, weightage: 0.3, isActive: true }
  ];

  // All classes: LKG, UKG, 1-12
  const classes = ['LKG', 'UKG', ...Array.from({length: 12}, (_, i) => (i+1).toString())];
  const classTestTypes = {};
  classes.forEach(cls => {
    classTestTypes[cls] = [...defaultTestTypes]; // Create a copy for each class
  });

  return this.create({
    schoolId,
    schoolCode,
    classTestTypes,
    createdBy
  });
};

module.exports = mongoose.model('TestDetails', testDetailsSchema);
