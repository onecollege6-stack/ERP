const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true }, // e.g., NPS
  logoUrl: { type: String },
  principalName: { type: String },
  principalEmail: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  // Role access matrix with explicit permissions for each role
  accessMatrix: {
    admin: {
      manageUsers: { type: Boolean, default: true },
      manageSchoolSettings: { type: Boolean, default: true },
      viewTimetable: { type: Boolean, default: true },
      viewAttendance: { type: Boolean, default: true },
      viewResults: { type: Boolean, default: true },
      messageStudentsParents: { type: Boolean, default: true }
    },
    teacher: {
      manageUsers: { type: Boolean, default: false },
      manageSchoolSettings: { type: Boolean, default: false },
      viewTimetable: { type: Boolean, default: true },
      viewAttendance: { type: Boolean, default: true },
      viewResults: { type: Boolean, default: true },
      messageStudentsParents: { type: Boolean, default: true }
    },
    student: {
      manageUsers: { type: Boolean, default: false },
      manageSchoolSettings: { type: Boolean, default: false },
      viewTimetable: { type: Boolean, default: true },
      viewAttendance: { type: Boolean, default: true },
      viewResults: { type: Boolean, default: true },
      messageStudentsParents: { type: Boolean, default: false }
    },
    parent: {
      manageUsers: { type: Boolean, default: false },
      manageSchoolSettings: { type: Boolean, default: false },
      viewTimetable: { type: Boolean, default: true },
      viewAttendance: { type: Boolean, default: true },
      viewResults: { type: Boolean, default: true },
      messageStudentsParents: { type: Boolean, default: false }
    }
  },

  // Bank details (for fees, payouts)
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    branch: String,
    accountHolderName: String
  },
  
  // School settings
  settings: {
    academicYear: {
      startDate: Date,
      endDate: Date,
      currentYear: String
    },
    classes: [String], // ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    sections: [String], // ['A', 'B', 'C', 'D']
    subjects: [String], // ['Math', 'Science', 'English', 'History', 'Geography']
    workingDays: [String], // ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    workingHours: {
      start: String, // '08:00'
      end: String    // '15:00'
    },
    holidays: [{
      date: Date,
      description: String
    }]
  },
  
  // School statistics
  stats: {
    totalStudents: { type: Number, default: 0 },
    totalTeachers: { type: Number, default: 0 },
    totalParents: { type: Number, default: 0 },
    totalClasses: { type: Number, default: 0 }
  },
  
  // School features
  features: {
    hasTransport: { type: Boolean, default: false },
    hasCanteen: { type: Boolean, default: false },
    hasLibrary: { type: Boolean, default: false },
    hasSports: { type: Boolean, default: false },
    hasComputerLab: { type: Boolean, default: false }
  },
  
  isActive: { type: Boolean, default: true },
  establishedDate: Date,
  
  // Support multiple admins per school
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // New fields for additional school details
  schoolType: { type: String, enum: ['Public', 'Private', 'International'], required: true },
  establishedYear: { type: Number, required: true },
  affiliationBoard: { type: String, enum: ['CBSE', 'ICSE', 'State Board', 'IB'], required: true },
  website: { type: String },
  secondaryContact: { type: String },
  
  // Database management fields
  databaseName: { type: String, unique: true },
  databaseCreated: { type: Boolean, default: false },
  databaseCreatedAt: { type: Date }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full address
schoolSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '');
});

// Index for better query performance
schoolSchema.index({ 'settings.academicYear.currentYear': 1 });
schoolSchema.index({ isActive: 1 });

module.exports = mongoose.model('School', schoolSchema);
