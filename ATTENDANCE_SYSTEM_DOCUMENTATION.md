# Attendance Management System Documentation

## Overview
The attendance management system allows administrators and teachers to mark and track student attendance for specific classes and sections with morning/afternoon session support.

## Features Implemented

### 🎯 Core Functionality
- **Session-based Attendance**: Morning and afternoon sessions
- **Class & Section Filtering**: Cascading dropdowns for precise selection
- **Status Options**: Present, Absent, Half-day
- **Bulk Operations**: Mark all present/absent with one click
- **Search & Filter**: Find students by name or User ID
- **Real-time Summary**: Live count of present/absent/half-day/unmarked students

### 📊 Data Storage
- **Database**: MongoDB with Attendance collection
- **School-specific**: Each school's attendance stored separately
- **Audit Trail**: Tracks who marked attendance and when
- **Modification History**: Logs any changes with reasons

## API Endpoints

### 1. Mark Session Attendance
```
POST /api/attendance/mark-session
```
**Purpose**: Mark attendance for multiple students in a specific session

**Request Body**:
```json
{
  "date": "2025-09-06",
  "class": "Class 5",
  "section": "A", 
  "session": "morning",
  "students": [
    {
      "studentId": "ObjectId",
      "userId": "P-S-0001",
      "status": "present"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Morning attendance marked successfully: 25 students processed, 0 failed",
  "data": {
    "date": "2025-09-06",
    "class": "Class 5",
    "section": "A",
    "session": "morning",
    "totalStudents": 25,
    "successCount": 25,
    "failCount": 0,
    "results": [...]
  }
}
```

### 2. Get Class Attendance
```
GET /api/attendance/class?class=Class%205&section=A&date=2025-09-06&session=morning
```
**Purpose**: Retrieve attendance records for a specific class/section/date

**Response**:
```json
{
  "success": true,
  "data": {
    "class": "Class 5",
    "section": "A", 
    "date": "2025-09-06",
    "session": "morning",
    "totalRecords": 25,
    "records": [
      {
        "attendanceId": "NPS_ATT_20250906_Class5A_001",
        "studentId": "ObjectId",
        "studentName": "John Doe",
        "userId": "P-S-0001",
        "status": "present",
        "session": "morning",
        "markedAt": "2025-09-06T08:30:00Z"
      }
    ]
  }
}
```

## Database Schema

### Attendance Collection
```javascript
{
  attendanceId: "NPS_ATT_20250906_Class5A_001",
  schoolId: ObjectId,
  schoolCode: "NPS",
  studentId: ObjectId,
  studentName: "John Doe",
  studentRollNumber: "P-S-0001",
  class: "Class 5",
  section: "A",
  date: Date,
  status: "present|absent|half-day",
  sessionInfo: {
    session: "morning|afternoon",
    markedAt: Date,
    markedBy: ObjectId,
    markerName: "Admin User"
  },
  timeTracking: {
    schoolStartTime: "08:00",
    schoolEndTime: "15:30",
    checkIn: {
      time: "08:15",
      timestamp: Date,
      method: "manual",
      recordedBy: ObjectId,
      session: "morning"
    }
  },
  createdBy: ObjectId,
  createdAt: Date,
  modifications: [...]
}
```

## Frontend Components

### MarkAttendance.tsx
**Location**: `frontend/src/roles/admin/pages/MarkAttendance.tsx`

**Key Features**:
- Cascading class/section dropdowns
- Morning/afternoon session toggle
- Student search functionality
- Real-time attendance summary
- Bulk marking operations
- Auto-load existing attendance

**State Management**:
```typescript
interface Student {
  _id: string;
  userId: string;
  name: string;
  class: string;
  section: string;
  morningStatus: 'present' | 'absent' | 'half-day' | null;
  afternoonStatus: 'present' | 'absent' | 'half-day' | null;
}
```

## Usage Workflow

### 1. For Administrators/Teachers:
1. **Select Date**: Choose the date for attendance
2. **Select Class**: Pick from available classes (Class 1-10)
3. **Select Section**: Choose section (A, B, C, D) - appears after class selection
4. **Choose Session**: Toggle between Morning/Afternoon
5. **Mark Attendance**: Click status buttons for each student
6. **Bulk Operations**: Use "Mark All Present/Absent" for quick marking
7. **Search Students**: Filter by name or User ID
8. **Save**: Click "Save Attendance" to store in database

### 2. System Behavior:
- **Auto-load**: Existing attendance automatically loads when date/class/section changes
- **Real-time Updates**: Summary cards update as you mark attendance
- **Validation**: Prevents saving without marking at least one student
- **Error Handling**: Shows detailed error messages for failures
- **Success Feedback**: Confirms successful saves with student count

## Integration Points

### School Context
- All attendance records are school-specific using `schoolCode`
- User permissions checked (admin/teacher only)
- Student data filtered by school

### User Management
- Integrates with SchoolUser API for student data
- Displays User IDs in format P-S-0001, P-T-0007, etc.
- Fetches students by class and section

### Authentication
- Requires valid JWT token
- User role validation (admin/teacher)
- School context enforcement

## Technical Specifications

### Backend
- **Node.js + Express**: RESTful API endpoints
- **MongoDB + Mongoose**: Data persistence with schema validation
- **JWT Authentication**: Secure access control
- **Error Handling**: Comprehensive error responses

### Frontend
- **React + TypeScript**: Type-safe component development
- **Tailwind CSS**: Modern, responsive UI design
- **Lucide Icons**: Consistent iconography
- **Axios**: HTTP client for API communication

## Testing

### Manual Testing Steps:
1. **Login**: Authenticate as admin/teacher
2. **Navigate**: Go to Admin → Attendance → Mark Attendance
3. **Select**: Choose Class 5, Section A, current date, morning session
4. **Mark**: Set various attendance statuses for students
5. **Save**: Verify successful save with proper feedback
6. **Reload**: Refresh page and verify attendance loads correctly
7. **Session Switch**: Change to afternoon, verify separate tracking

### API Testing:
Use the provided test file: `backend/test-attendance-system.js`

```bash
cd backend
node test-attendance-system.js
```

## Security Considerations

### Access Control
- Only admin and teacher roles can mark attendance
- School-specific data isolation
- JWT token validation on all endpoints

### Data Validation
- Required field validation
- Status enum enforcement
- Date format validation
- Student existence verification

### Audit Trail
- All attendance changes logged
- User identification for modifications
- Timestamp tracking for all operations

## Future Enhancements

### Potential Improvements:
1. **Parent Notifications**: SMS/Email alerts for absences
2. **Biometric Integration**: RFID/fingerprint attendance
3. **Mobile App**: Dedicated mobile interface
4. **Analytics Dashboard**: Attendance trends and insights
5. **Leave Management**: Integration with leave requests
6. **Automated Reports**: Weekly/monthly attendance reports

## Troubleshooting

### Common Issues:

1. **Students Not Loading**
   - Verify class and section are correctly selected
   - Check if students exist in the school database
   - Ensure proper schoolCode context

2. **Attendance Not Saving**
   - Verify user has admin/teacher permissions
   - Check network connectivity
   - Ensure at least one student is marked

3. **Session Data Not Persisting**
   - Verify session parameter in API calls
   - Check if date format is correct (YYYY-MM-DD)
   - Ensure proper state management in frontend

### Debug Steps:
1. Check browser console for errors
2. Verify API responses in Network tab
3. Check server logs for backend errors
4. Validate database connection and data

## Conclusion

The attendance management system provides a comprehensive solution for tracking student attendance with session-based granularity, real-time feedback, and proper data persistence. The system is designed to be user-friendly, secure, and scalable for educational institutions.
