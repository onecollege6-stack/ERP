# Academic Test Configuration API Documentation

This document provides details about the Academic Test Configuration API for the School ERP System.

## Overview

The Academic Test Configuration API allows superadmins to manage:
- School types (Kindergarten, Primary, Secondary, etc.)
- Classes/Grades (LKG, UKG, 1-12)
- Test details for each class (Test types, maximum marks, etc.)

All data is stored in school-specific databases to maintain multi-tenant architecture.

## API Endpoints

### School Academic Settings

#### Get School Academic Settings
- **Endpoint:** `GET /api/superadmin/academic/schools/:schoolId/settings`
- **Auth Required:** Yes (Superadmin only)
- **Description:** Retrieves the academic settings for a specific school.
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "schoolTypes": ["Kindergarten", "Primary", "Secondary"],
      "classes": ["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      "academicYear": "2024-25"
    }
  }
  ```

#### Update School Academic Settings
- **Endpoint:** `PUT /api/superadmin/academic/schools/:schoolId/settings`
- **Auth Required:** Yes (Superadmin only)
- **Description:** Updates the academic settings for a specific school.
- **Request Body:**
  ```json
  {
    "schoolTypes": ["Kindergarten", "Primary", "Secondary"],
    "classes": ["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    "academicYear": "2024-25"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "School academic settings updated successfully",
    "data": {
      "schoolTypes": ["Kindergarten", "Primary", "Secondary"],
      "classes": ["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      "academicYear": "2024-25"
    }
  }
  ```

### Test Details Management

#### Get All Test Details for a School
- **Endpoint:** `GET /api/superadmin/academic/schools/:schoolId/tests`
- **Auth Required:** Yes (Superadmin only)
- **Description:** Retrieves all test details for a specific school.
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "schoolId": "123456789",
      "classTestTypes": {
        "LKG": [
          {
            "name": "Term 1",
            "code": "T1",
            "description": "First term assessment",
            "maxMarks": 100,
            "weightage": 0.5,
            "isActive": true
          },
          {
            "name": "Term 2",
            "code": "T2",
            "description": "Second term assessment",
            "maxMarks": 100,
            "weightage": 0.5,
            "isActive": true
          }
        ],
        "5": [
          {
            "name": "Unit Test 1",
            "code": "UT1",
            "description": "First unit test",
            "maxMarks": 50,
            "weightage": 0.2,
            "isActive": true
          }
        ]
      }
    }
  }
  ```

#### Get Test Types for a Specific Class
- **Endpoint:** `GET /api/superadmin/academic/schools/:schoolId/tests/class/:className`
- **Auth Required:** Yes (Superadmin only)
- **Description:** Retrieves test types for a specific class in a school.
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "className": "5",
      "testTypes": [
        {
          "name": "Unit Test 1",
          "code": "UT1",
          "description": "First unit test",
          "maxMarks": 50,
          "weightage": 0.2,
          "isActive": true
        }
      ]
    }
  }
  ```

#### Add Test Type to a Class
- **Endpoint:** `POST /api/superadmin/academic/schools/:schoolId/tests/class/:className`
- **Auth Required:** Yes (Superadmin only)
- **Description:** Adds a new test type to a specific class.
- **Request Body:**
  ```json
  {
    "testType": {
      "name": "Unit Test 1",
      "code": "UT1",
      "description": "First unit test of the academic year",
      "maxMarks": 50,
      "weightage": 0.2,
      "isActive": true
    }
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Test type added to class successfully",
    "data": {
      "className": "5",
      "testType": {
        "name": "Unit Test 1",
        "code": "UT1",
        "description": "First unit test of the academic year",
        "maxMarks": 50,
        "weightage": 0.2,
        "isActive": true
      }
    }
  }
  ```

#### Remove Test Type from a Class
- **Endpoint:** `DELETE /api/superadmin/academic/schools/:schoolId/tests/class/:className/test/:testCode`
- **Auth Required:** Yes (Superadmin only)
- **Description:** Removes a test type from a specific class.
- **Response:**
  ```json
  {
    "success": true,
    "message": "Test type removed from class successfully",
    "data": {
      "className": "5",
      "testCode": "UT1"
    }
  }
  ```

## Data Models

### School Model (academicSettings field)
```javascript
academicSettings: {
  schoolTypes: {
    type: [String],
    default: ['Kindergarten', 'Primary', 'Secondary']
  },
  classes: {
    type: [String],
    default: ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  },
  academicYear: {
    type: String,
    default: function() {
      const year = new Date().getFullYear();
      return `${year}-${year + 1}`;
    }
  }
}
```

### TestDetails Model
```javascript
const testDetailsSchema = new mongoose.Schema({
  schoolId: {
    type: String,
    required: true,
  },
  classTestTypes: {
    type: Map,
    of: [{
      name: String,
      code: String,
      description: String,
      maxMarks: Number,
      weightage: Number,
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    default: {}
  }
}, { timestamps: true });
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Successful operation
- 400: Bad request (invalid input)
- 401: Unauthorized (no valid token)
- 403: Forbidden (insufficient permissions)
- 404: Resource not found
- 500: Server error

Error responses follow this format:
```json
{
  "success": false,
  "message": "Error message details",
  "error": "Error identifier"
}
```

## Authentication

All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

Only users with the superadmin role can access these endpoints.

## Testing

Use the provided test script `test-academic-config.js` to verify the API functionality:
```bash
node backend/test-academic-config.js
```
