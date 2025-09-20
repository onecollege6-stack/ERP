# School Academic Settings and Test Management Guide

This guide explains how to use the enhanced features for managing school academic settings and test details through the Super Admin panel.

## 1. Managing School Types and Academic Settings

As a Super Admin, you can now configure school types and academic settings for each school.

### API Endpoint

```
PUT /api/superadmin/schools/:schoolId/academic-settings
```

### Request Body

```json
{
  "schoolTypes": ["Kindergarten", "Primary", "Middle", "Secondary", "Higher Secondary"],
  "affiliationBoard": "CBSE",
  "classes": ["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
  "academicYear": "2024-25"
}
```

### Example Usage

```javascript
// Update school academic settings
async function updateSchoolAcademicSettings(schoolId) {
  try {
    const response = await fetch(`/api/superadmin/schools/${schoolId}/academic-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        schoolTypes: ["Kindergarten", "Primary", "Middle", "Secondary"],
        classes: ["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8"],
        academicYear: "2024-25"
      })
    });
    
    const data = await response.json();
    console.log('School academic settings updated:', data);
  } catch (error) {
    console.error('Error updating school academic settings:', error);
  }
}
```

## 2. Managing Tests for Each Class

Tests are now managed per class and stored in each school's database in the `testDetails` collection.

### Available Endpoints

- **Get Test Details for a School**:  
  `GET /api/superadmin/schools/:schoolId/test-details`

- **Update Test Details for a School**:  
  `PUT /api/superadmin/schools/:schoolId/test-details`

- **Get Test Types for a Specific Class**:  
  `GET /api/superadmin/schools/:schoolId/test-details/class/:className`

- **Update Test Types for a Specific Class**:  
  `PUT /api/superadmin/schools/:schoolId/test-details/class/:className`

- **Add a Test Type to a Specific Class**:  
  `POST /api/superadmin/schools/:schoolId/test-details/class/:className/test-type`

- **Remove a Test Type from a Specific Class**:  
  `DELETE /api/superadmin/schools/:schoolId/test-details/class/:className/test-type/:testTypeCode`

### Example: Adding a Test Type to a Class

```javascript
// Add a new test type to a class
async function addTestTypeToClass(schoolId, className) {
  try {
    const response = await fetch(`/api/superadmin/schools/${schoolId}/test-details/class/${className}/test-type`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        testType: {
          name: 'Unit Test 1',
          code: 'UT1',
          description: 'First unit test of the academic year',
          maxMarks: 50,
          weightage: 0.2,
          isActive: true
        },
        academicYear: '2024-25'
      })
    });
    
    const data = await response.json();
    console.log(`Test type added to class ${className}:`, data);
  } catch (error) {
    console.error('Error adding test type:', error);
  }
}
```

### Example: Removing a Test Type from a Class

```javascript
// Remove a test type from a class
async function removeTestTypeFromClass(schoolId, className, testTypeCode) {
  try {
    const response = await fetch(
      `/api/superadmin/schools/${schoolId}/test-details/class/${className}/test-type/${testTypeCode}?academicYear=2024-25`, 
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    console.log(`Test type removed from class ${className}:`, data);
  } catch (error) {
    console.error('Error removing test type:', error);
  }
}
```

## 3. Data Structure

### School Academic Settings

```javascript
{
  academicSettings: {
    schoolTypes: ["Kindergarten", "Primary", "Middle", "Secondary"],
    customGradeNames: {
      "LKG": "Lower Kindergarten",
      "UKG": "Upper Kindergarten"
    },
    gradeLevels: {
      "kindergarten": {
        displayName: "Kindergarten",
        description: "Pre-primary education (LKG-UKG)",
        gradingSystem: {
          type: "grade",
          passingScore: 0,
          maxScore: 0
        }
      },
      // ... other grade levels
    }
  },
  // ... other school fields
}
```

### Test Details

```javascript
{
  schoolId: ObjectId,
  schoolCode: "ABC",
  academicYear: "2024-25",
  classTestTypes: {
    "LKG": [
      {
        name: "Term 1 Assessment",
        code: "T1",
        description: "First term assessment",
        maxMarks: 100,
        weightage: 0.5,
        isActive: true
      },
      // ... other test types for LKG
    ],
    "UKG": [
      // ... test types for UKG
    ],
    "1": [
      // ... test types for Class 1
    ]
    // ... other classes
  },
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## 4. Implementation Notes

- Each school's test details are stored in their school-specific database in the `testDetails` collection
- When classes are added or updated, test details are automatically created with default test types
- Test types can be customized per class to support different assessment strategies
- All changes are tracked with `createdBy` and `updatedBy` fields for audit purposes

## 5. Frontend Integration

The SuperAdmin dashboard should include:

1. A section to manage school types and academic settings
2. A section to view and manage classes for each school
3. A section to manage test types for each class

These features enable a complete academic configuration system that supports the full range of educational institutions from kindergarten through higher secondary.
