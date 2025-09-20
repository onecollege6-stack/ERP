# Academic Test Configuration for Superadmin Panel

## Overview
The Academic Test Configuration component provides a comprehensive interface for superadmins to manage test types and assessments across all classes (LKG to Class 12) for any school in the system.

## Features

### 1. **Test Type Management**
- Add new test types to any class with minimal required information
- **Required Fields:**
  - Class Selection (LKG, UKG, 1-12)
  - Test Name (e.g., "Formative Assessment 1")
- **Optional Fields (Collapsible):**
  - Test Code (auto-generated if not provided)
  - Description
  - Maximum Marks (defaults to 100)
  - Weightage (defaults to 10%)
  - Active/Inactive status (defaults to Active)

### 2. **Class-wise Organization**
- Expandable class sections (LKG, UKG, 1-12)
- Visual indicators for:
  - Number of tests per class
  - Total weightage percentage
  - Weightage validation (green for 100%, yellow for other values)

### 3. **Default Test Types**
Each class is initialized with standard test types:
- **Formative Assessment 1 (FA-1)**: 20 marks, 10% weightage
- **Formative Assessment 2 (FA-2)**: 20 marks, 10% weightage  
- **Summative Assessment 1 (SA-1)**: 80 marks, 30% weightage
- **Summative Assessment 2 (SA-2)**: 80 marks, 30% weightage
- **Final Examination (FINAL)**: 100 marks, 100% weightage

### 4. **Bulk Operations**
- Save all configurations across all classes
- Real-time updates to the backend
- Validation and error handling

## Navigation

The Academic Test Configuration is accessible from the superadmin navigation panel:
- **Navigation Item**: "Test Configuration" 
- **Icon**: Award icon
- **Route**: `academic-test-config`

## Prerequisites

1. **School Selection**: A school must be selected before accessing test configuration
2. **Authentication**: Valid superadmin authentication token required
3. **School Code**: The selected school must have a valid school code

## API Integration

The component integrates with existing backend APIs:

### Endpoints Used:
- `GET /api/test-details/{schoolId}` - Fetch test configurations
- `PUT /api/test-details/school/{schoolCode}` - Update test configurations

### Data Structure:
```typescript
interface TestType {
  _id?: string;
  name: string;
  code: string;
  description: string;
  maxMarks: number;
  weightage: number;
  isActive: boolean;
}
```

## Usage Instructions

### Adding a New Test Type:
1. **Required Steps:**
   - Select a class from the dropdown (marked with red asterisk)
   - Enter test name (marked with red asterisk)
   - Click "Add Test Type"

2. **Optional Configuration:**
   - Click "Optional Settings" to expand additional fields
   - Configure test code, marks, weightage, description, and status
   - If test code is left empty, it will be auto-generated

### Managing Existing Tests:
1. Expand a class section by clicking on it
2. View all configured test types
3. Use the trash icon to remove unwanted tests
4. Monitor weightage totals for proper assessment balance

### Saving Changes:
- Individual changes are saved automatically when adding/removing tests
- Use "Save All Configurations" for bulk updates
- Success/error notifications provide feedback

## Error Handling

The component includes comprehensive error handling for:
- Network connectivity issues
- Authentication failures
- Invalid school codes
- API response errors
- Validation failures

## Responsive Design

The interface is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices (with appropriate layout adjustments)

## Security

- All API calls include proper authentication headers
- School context validation ensures superadmin access only
- Input validation prevents malicious data submission

## Integration with Admin Panel

While this component is specifically for superadmins, the same test configurations are used by:
- School admins (via their admin panel)
- Teachers (for viewing available test types)
- Students/Parents (for understanding assessment structure)

This ensures consistency across all user roles within the ERP system.
