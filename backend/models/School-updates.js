// Updates for backend/models/School.js - Add these fields to the schoolSchema

// Add this to the schoolSchema definition:

  // Academic settings for school types and configurations
  academicSettings: {
    schoolTypes: [{ 
      type: String, 
      enum: ['Kindergarten', 'Primary', 'Middle', 'Secondary', 'Higher Secondary', 'K-12'] 
    }],
    customGradeNames: { 
      type: Map, 
      of: String,
      default: new Map([
        ['LKG', 'Lower Kindergarten'],
        ['UKG', 'Upper Kindergarten']
      ])
    },
    gradeLevels: {
      type: Map,
      of: {
        displayName: String,
        description: String,
        gradingSystem: {
          type: { type: String, enum: ['percentage', 'grade', 'gpa'] },
          passingScore: Number,
          maxScore: Number
        }
      },
      default: new Map([
        ['kindergarten', { 
          displayName: 'Kindergarten', 
          description: 'Pre-primary education (LKG-UKG)',
          gradingSystem: { 
            type: 'grade', 
            passingScore: 0, 
            maxScore: 0 
          }
        }],
        ['primary', { 
          displayName: 'Primary', 
          description: 'Primary education (Classes 1-5)',
          gradingSystem: { 
            type: 'percentage', 
            passingScore: 33, 
            maxScore: 100 
          }
        }],
        ['middle', { 
          displayName: 'Middle School', 
          description: 'Middle education (Classes 6-8)',
          gradingSystem: { 
            type: 'percentage', 
            passingScore: 35, 
            maxScore: 100 
          }
        }],
        ['secondary', { 
          displayName: 'Secondary', 
          description: 'Secondary education (Classes 9-10)',
          gradingSystem: { 
            type: 'percentage', 
            passingScore: 33, 
            maxScore: 100 
          }
        }],
        ['higher', { 
          displayName: 'Higher Secondary', 
          description: 'Higher secondary education (Classes 11-12)',
          gradingSystem: { 
            type: 'percentage', 
            passingScore: 33, 
            maxScore: 100 
          }
        }]
      ])
    }
  },
