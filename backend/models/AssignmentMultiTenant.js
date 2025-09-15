const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  // Basic Information
  assignmentId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `ASG_${this.schoolCode}_${Date.now()}`;
    }
  },
  
  // School Information (to link back to main database)
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School',
    required: true
  },
  
  schoolCode: {
    type: String,
    required: true
  },
  
  // Assignment Details
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  
  description: { 
    type: String, 
    required: true 
  },
  
  subject: { 
    type: String, 
    required: true 
  },
  
  class: { 
    type: String, 
    required: true 
  },
  
  section: { 
    type: String, 
    required: true 
  },
  
  teacher: { 
    type: String,  // Store teacherId as string to avoid cross-database references
    required: true 
  },
  
  teacherName: {
    type: String,
    required: true
  },
  
  // Assignment Timeline
  startDate: { 
    type: Date, 
    required: true 
  },
  
  dueDate: { 
    type: Date, 
    required: true 
  },
  
  instructions: String,
  
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Status and Tracking
  status: { 
    type: String, 
    enum: ['draft', 'active', 'completed', 'archived'], 
    default: 'active' 
  },
  
  isPublished: { 
    type: Boolean, 
    default: true 
  },
  
  publishedAt: { 
    type: Date,
    default: Date.now
  },
  
  // Student Submissions Tracking
  totalStudents: { 
    type: Number, 
    default: 0 
  },
  
  submittedCount: { 
    type: Number, 
    default: 0 
  },
  
  gradedCount: { 
    type: Number, 
    default: 0 
  },
  
  // Academic Year and Term
  academicYear: { 
    type: String, 
    required: true,
    default: function() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // Jan is 0, Dec is 11
      
      // If current month is before April, use previous year as start of academic year
      if (month < 4) {
        return `${year-1}-${year.toString().substr(2,2)}`;
      } else {
        return `${year}-${(year+1).toString().substr(2,2)}`;
      }
    }
  },
  
  term: { 
    type: String, 
    default: 'Term 1' 
  },
  
  // Created and Updated Information
  createdBy: { 
    type: String,  // Store userId as string to avoid cross-database references
    required: true 
  },
  
  createdByName: {
    type: String,
    required: true
  },
  
  updatedBy: { 
    type: String  // Store userId as string to avoid cross-database references
  },
  
  updatedByName: {
    type: String
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  collection: 'assignments'
});

// Virtuals

// Virtual for submission percentage
assignmentSchema.virtual('submissionPercentage').get(function() {
  if (this.totalStudents === 0) return 0;
  return Math.round((this.submittedCount / this.totalStudents) * 100);
});

// Virtual for days until due
assignmentSchema.virtual('daysUntilDue').get(function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for assignment status
assignmentSchema.virtual('assignmentStatus').get(function() {
  if (this.status === 'completed') return 'completed';
  if (this.status === 'archived') return 'archived';
  
  const daysUntilDue = this.daysUntilDue;
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 7) return 'due-soon';
  return 'active';
});

// Indexes for better query performance
assignmentSchema.index({ schoolCode: 1, status: 1 });
assignmentSchema.index({ teacher: 1 });
assignmentSchema.index({ class: 1, section: 1 });
assignmentSchema.index({ subject: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ academicYear: 1, term: 1 });

const DefaultModel = mongoose.model('AssignmentMultiTenant', assignmentSchema);

/**
 * Return an Assignment model bound to a specific mongoose connection.
 * When bound to a school connection, we store documents in the 'assignments'
 * collection (so they appear as e.g. school_p.assignments).
 */
module.exports = DefaultModel;

module.exports.getModelForConnection = function(connection) {
  if (!connection) throw new Error('Connection is required to get model for school DB');

  // If already registered on this connection, return it
  if (connection.models && connection.models.AssignmentMultiTenant) {
    return connection.models.AssignmentMultiTenant;
  }

  // Bind model to the provided connection and use 'assignments' collection name
  const model = connection.model('AssignmentMultiTenant', assignmentSchema, 'assignments');
  return model;
};
