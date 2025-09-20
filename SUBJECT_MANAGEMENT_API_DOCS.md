# Subject Management API Documentation

This document provides details about the Subject Management API for the School ERP System SuperAdmin Panel.

## Overview

The Subject Management API allows superadmins to manage subjects for each class from LKG to Class 12. This provides a class-wise subject organization similar to the test configuration system.

## Features

- View all subjects organized by class
- Get subjects for a specific class
- Add new subjects to specific classes
- Update existing subjects
- Remove subjects from classes
- Support for core/elective subjects
- Academic details configuration (marks, practical, projects)

## API Endpoints

### Get All Subjects by Class

#### Get School Subjects Organized by Class
- **Endpoint:** `GET /api/superadmin/subjects/schools/:schoolId/subjects`
- **Auth Required:** Yes (Superadmin only)
- **Description:** Retrieves all subjects for a school organized by class from LKG to Class 12.

**Response:**
```json
{
  "success": true,
  "data": {
    "schoolId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "schoolName": "Green Valley School",
    "schoolCode": "GVS",
    "subjectsByClass": {
      "LKG": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "subjectId": "GVS_SUB_001",
          "subjectName": "English",
          "subjectCode": "ENG",
          "subjectType": "academic",
          "category": "core",
          "isCore": true,
          "isOptional": false,
          "streams": [],
          "academicDetails": {
            "totalMarks": 100,
            "passingMarks": 33,
            "theoryMarks": 70,
            "practicalMarks": 30,
            "hasPractical": false,
            "hasProject": false
          },
          "teacherCount": 2,
          "isActive": true
        }
      ],
      "UKG": [],
      "1": [],
      "2": [],
      // ... other classes
      "12": []
    }
  }
}
```

### Class-Specific Subject Management

#### Get Subjects for a Specific Class
- **Endpoint:** `GET /api/superadmin/subjects/schools/:schoolId/subjects/class/:className`
- **Auth Required:** Yes (Superadmin only)
- **Description:** Retrieves all subjects for a specific class.

**Parameters:**
- `schoolId`: School ID
- `className`: Class name (LKG, UKG, 1, 2, ..., 12)

**Response:**
```json
{
  "success": true,
  "data": {
    "className": "5",
    "subjects": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "subjectId": "GVS_SUB_001",
        "subjectName": "Mathematics",
        "subjectCode": "MATH",
        "subjectType": "academic",
        "category": "core",
        "isCore": true,
        "isOptional": false,
        "streams": [],
        "academicDetails": {
          "totalMarks": 100,
          "passingMarks": 35,
          "theoryMarks": 80,
          "practicalMarks": 20,
          "hasPractical": true,
          "hasProject": false,
          "projectMarks": 0
        },
        "teacherAssignments": [],
        "isActive": true,
        "createdAt": "2024-09-17T10:30:00.000Z"
      }
    ],
    "totalSubjects": 1
  }
}
```

#### Add Subject to Class
- **Endpoint:** `POST /api/superadmin/subjects/schools/:schoolId/subjects/class/:className`
- **Auth Required:** Yes (Superadmin only)
- **Description:** Adds a new subject to a specific class.

**Request Body:**
```json
{
  "subjectData": {
    "subjectName": "Environmental Studies",
    "subjectCode": "ENV",
    "subjectType": "academic",
    "category": "core",
    "isCore": true,
    "isOptional": false,
    "totalMarks": 100,
    "passingMarks": 35,
    "theoryMarks": 80,
    "practicalMarks": 20,
    "hasPractical": true,
    "hasProject": false,
    "projectMarks": 0,
    "description": "Study of environment and nature",
    "objectives": ["Understand ecosystem", "Environmental awareness"],
    "learningOutcomes": ["Can identify environmental issues"],
    "streams": [],
    "academicYear": "2024-25"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subject added to class successfully",
  "data": {
    "subject": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "subjectId": "GVS_SUB_002",
      "subjectName": "Environmental Studies",
      "subjectCode": "ENV",
      "className": "5",
      "isCore": true,
      "isOptional": false
    }
  }
}
```

#### Update Subject for Class
- **Endpoint:** `PUT /api/superadmin/subjects/schools/:schoolId/subjects/class/:className/subject/:subjectId`
- **Auth Required:** Yes (Superadmin only)
- **Description:** Updates an existing subject for a specific class.

**Request Body:**
```json
{
  "subjectData": {
    "subjectName": "Environmental Science",
    "description": "Updated description: Comprehensive study of environment",
    "academicDetails": {
      "totalMarks": 100,
      "passingMarks": 40,
      "theoryMarks": 70,
      "practicalMarks": 30
    },
    "isCore": false,
    "isOptional": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subject updated successfully",
  "data": {
    "subject": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "subjectId": "GVS_SUB_002",
      "subjectName": "Environmental Science",
      "subjectCode": "ENV",
      "className": "5",
      "isCore": false,
      "isOptional": true
    }
  }
}
```

#### Remove Subject from Class
- **Endpoint:** `DELETE /api/superadmin/subjects/schools/:schoolId/subjects/class/:className/subject/:subjectId`
- **Auth Required:** Yes (Superadmin only)
- **Description:** Removes a subject from a specific class.

**Response:**
```json
{
  "success": true,
  "message": "Subject removed from class successfully",
  "data": {
    "className": "5",
    "subjectId": "64f8a1b2c3d4e5f6a7b8c9d2"
  }
}
```

## Subject Data Model

### Subject Schema Fields

```javascript
{
  subjectId: String,           // Auto-generated: "GVS_SUB_001"
  subjectName: String,         // "Mathematics", "English"
  subjectCode: String,         // "MATH", "ENG"
  schoolId: ObjectId,          // Reference to school
  schoolCode: String,          // "GVS", "DPS"
  
  // Grade applicability
  applicableGrades: [{
    grade: String,             // "1", "2", "LKG", "UKG"
    level: String,             // "elementary", "middle", "high", "higherSecondary"
    isCore: Boolean,           // Core subject or elective
    isOptional: Boolean,       // Optional subject
    streams: [String]          // For grades 11-12: ["Science", "Commerce"]
  }],
  
  // Subject classification
  subjectType: String,         // "academic", "activity", "language"
  category: String,            // "core", "elective", "additional"
  
  // Academic configuration
  academicDetails: {
    totalMarks: Number,        // Default: 100
    passingMarks: Number,      // Default: 33
    theoryMarks: Number,       // Default: 70
    practicalMarks: Number,    // Default: 30
    hasPractical: Boolean,     // Has practical component
    hasProject: Boolean,       // Has project component
    projectMarks: Number       // Project marks if applicable
  },
  
  // Curriculum details
  curriculum: {
    description: String,
    objectives: [String],
    learningOutcomes: [String]
  },
  
  // Teacher assignments
  teacherAssignments: [{
    teacherId: ObjectId,
    teacherName: String,
    assignedGrades: [String],
    role: String,              // "primary_teacher", "secondary_teacher"
    isActive: Boolean
  }],
  
  isActive: Boolean,
  academicYear: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Subject Types and Categories

### Subject Types
- `academic`: Core academic subjects (Math, Science, Languages)
- `activity`: Activity-based subjects (Art, Music, Dance)
- `language`: Language subjects (English, Hindi, Regional languages)
- `science`: Science subjects (Physics, Chemistry, Biology)
- `mathematics`: Mathematics and related subjects
- `social_studies`: Social studies, History, Geography
- `arts`: Arts and creative subjects
- `physical_education`: Sports and physical education
- `moral_science`: Moral science and value education

### Subject Categories
- `core`: Mandatory subjects for all students
- `elective`: Optional subjects students can choose
- `additional`: Additional subjects for enhancement
- `co_curricular`: Co-curricular activities

## Grade Levels

- **Elementary**: LKG, UKG, 1, 2, 3, 4, 5
- **Middle**: 6, 7, 8
- **High**: 9, 10
- **Higher Secondary**: 11, 12 (with stream support)

## Error Handling

Standard HTTP status codes:
- `200`: Success
- `400`: Bad request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden (insufficient permissions)
- `404`: Resource not found
- `500`: Server error

Error response format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Testing

Run the subject management test script:
```bash
npm run test:subjects
```

The test script will:
1. Get all subjects organized by class
2. Get subjects for a specific class
3. Add a new subject to a class
4. Update the subject
5. Add the same subject to another class
6. Remove subjects from classes
7. Verify final state

## Integration with Frontend

The API is designed to work with a frontend interface similar to the test configuration, where:
- Classes are displayed in a list (LKG to Class 12)
- Each class shows its subject count
- Clicking on a class shows its subjects
- Add/Edit/Delete functionality for each class
- Support for subject details like marks, practical components, etc.

## Security

- All endpoints require superadmin authentication
- School-specific database isolation
- Input validation and sanitization
- Role-based access control
- Audit trail for all modifications
