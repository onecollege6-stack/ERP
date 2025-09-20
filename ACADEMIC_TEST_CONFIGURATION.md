# Academic Test Configuration Documentation

## Overview

This document outlines the implementation of academic test configuration functionality in the superadmin panel. This feature allows superadmins to manage school types, class lists (LKG, UKG, 1-12), and test details per class, which are stored in each school's database.

## Key Features

1. **School Types Management**: Add/remove school types (Kindergarten, Primary, Middle, Secondary, etc.)
2. **Class Configuration**: Configure available classes for each school (LKG, UKG, 1-12)
3. **Test Types Management**: Add/remove test types for each class (FA-1, FA-2, Midterm, etc.)
4. **Academic Settings**: Update school academic settings

## API Endpoints

All endpoints require superadmin authentication.

### Get All Test Details for a School

- **Endpoint**: `/api/superadmin/academic/schools/:schoolId/academic/tests`
- **Method**: GET
- **Description**: Retrieves all test details for a specific school
- **Parameters**:
  - `schoolId`: ID of the school
  - `academicYear` (query, optional): Academic year (default: '2024-25')
- **Response**: JSON object containing test details for all classes

### Get Test Types for a Specific Class

- **Endpoint**: `/api/superadmin/academic/schools/:schoolId/academic/tests/class/:className`
- **Method**: GET
- **Description**: Retrieves test types for a specific class in a school
- **Parameters**:
  - `schoolId`: ID of the school
  - `className`: Name of the class (e.g., 'LKG', 'UKG', '1', '2', etc.)
  - `academicYear` (query, optional): Academic year (default: '2024-25')
- **Response**: JSON object containing test types for the specified class

### Add Test Type to a Class

- **Endpoint**: `/api/superadmin/academic/schools/:schoolId/academic/tests/class/:className`
- **Method**: POST
- **Description**: Adds a new test type to a specific class
- **Parameters**:
  - `schoolId`: ID of the school
  - `className`: Name of the class
  - `academicYear` (body, optional): Academic year (default: '2024-25')
- **Request Body**:
  ```json
  {
    "testType": {
      "name": "Test Name",
      "code": "TEST_CODE",
      "description": "Test description",
      "maxMarks": 100,
      "weightage": 1,
      "isActive": true
    }
  }
  ```
- **Response**: JSON object containing updated test types for the class

### Remove Test Type from a Class

- **Endpoint**: `/api/superadmin/academic/schools/:schoolId/academic/tests/class/:className/test/:testTypeCode`
- **Method**: DELETE
- **Description**: Removes a test type from a specific class
- **Parameters**:
  - `schoolId`: ID of the school
  - `className`: Name of the class
  - `testTypeCode`: Code of the test type to remove
  - `academicYear` (query, optional): Academic year (default: '2024-25')
- **Response**: JSON object containing updated test types for the class

### Update School Academic Settings

- **Endpoint**: `/api/superadmin/academic/schools/:schoolId/academic/settings`
- **Method**: PUT
- **Description**: Updates academic settings for a school
- **Parameters**:
  - `schoolId`: ID of the school
- **Request Body**:
  ```json
  {
    "schoolTypes": ["Primary", "Secondary", "Higher Secondary"],
    "classes": ["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    "academicYear": "2024-25"
  }
  ```
- **Response**: JSON object containing updated academic settings

## Data Models

### TestDetails Model

- **schoolId**: Reference to School model
- **schoolCode**: School code (uppercase)
- **academicYear**: Academic year (default: '2024-25')
- **classTestTypes**: Map of class name to array of test types
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp
- **createdBy**: User who created the record
- **updatedBy**: User who last updated the record

### School Model (Updated)

- **academicSettings**: 
  - **schoolTypes**: Array of school types
  - **customGradeNames**: Map of grade code to display name
  - **gradeLevels**: Map of level code to level details

## Testing

Use the `test-academic-config.js` script to test the implementation:

```bash
node backend/test-academic-config.js
```

## Implementation Notes

1. All operations are restricted to users with the 'superadmin' role
2. Changes to test types are specific to each school and don't affect other schools
3. Default test types are created for new schools
4. When adding a new class, default test types are automatically created for it

## Frontend Integration

The frontend should make API calls to these endpoints to manage academic settings in the superadmin panel. No changes to the admin panel are required.
