# New Admin Features Documentation

This document describes the three new admin features added to the InstituteERP system: Messages, Fees, and Reports.

## Overview

The new features provide comprehensive functionality for:
- **Messages**: Send notifications to students by class/section
- **Fees**: Fee structure management and offline payment tracking
- **Reports**: Financial and engagement analytics dashboard

## API Endpoints

### Messages API (`/api/messages`)

#### POST `/api/messages/send`
Send a message to students by class/section.

**Request Body:**
```json
{
  "title": "Message Title",
  "body": "Message content",
  "class": "ALL" | "1" | "2" | ... | "12",
  "section": "ALL" | "A" | "B" | "C" | "D"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "messageId": "message_id",
    "sentCount": 25,
    "recipients": [...]
  }
}
```

#### GET `/api/messages`
Fetch sent messages with filtering.

**Query Parameters:**
- `schoolId` (optional): School ID filter
- `class` (optional): Class filter
- `section` (optional): Section filter
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Message status filter (default: 'sent')

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

#### GET `/api/messages/:messageId`
Get detailed message information including recipients.

#### GET `/api/messages/stats`
Get message statistics and engagement metrics.

### Fees API (`/api/fees`)

#### POST `/api/fees/structures`
Create a new fee structure.

**Request Body:**
```json
{
  "name": "Annual Fee 2024-25",
  "description": "Annual fee structure",
  "class": "ALL",
  "section": "ALL",
  "totalAmount": 50000,
  "installments": [
    {
      "name": "Term 1 Fee",
      "amount": 25000,
      "dueDate": "2024-06-01",
      "description": "First term fee",
      "isOptional": false,
      "lateFeeAmount": 500
    }
  ],
  "academicYear": "2024-25",
  "applyToStudents": true
}
```

#### GET `/api/fees/structures`
Fetch fee structures with filtering.

#### GET `/api/fees/records`
Fetch student fee records with filtering and pagination.

#### POST `/api/fees/records/:studentId/offline-payment`
Record an offline payment for a student.

**Request Body:**
```json
{
  "installmentName": "Term 1 Fee",
  "amount": 25000,
  "paymentDate": "2024-05-15",
  "paymentMethod": "cash",
  "paymentReference": "REC-001",
  "remarks": "Payment received"
}
```

#### GET `/api/fees/stats`
Get fee collection statistics and KPIs.

### Reports API (`/api/reports`)

#### GET `/api/reports/summary`
Get comprehensive financial and engagement summary.

**Query Parameters:**
- `from` (optional): Start date filter
- `to` (optional): End date filter

**Response:**
```json
{
  "success": true,
  "data": {
    "financial": {
      "totalBilled": 1000000,
      "totalCollected": 750000,
      "totalOutstanding": 250000,
      "collectionPercentage": 75,
      "totalRecords": 100,
      "paidRecords": 60,
      "partialRecords": 25,
      "overdueRecords": 15
    },
    "engagement": {
      "totalMessages": 50,
      "totalRecipients": 500,
      "totalRead": 400,
      "avgReadRate": 80.0
    },
    "breakdown": {
      "classWise": [...],
      "monthlyCollection": [...]
    }
  }
}
```

#### GET `/api/reports/dues`
Get outstanding dues list for export.

**Query Parameters:**
- `class` (optional): Class filter
- `section` (optional): Section filter
- `status` (optional): Status filter
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 1000)

#### GET `/api/reports/class-wise`
Get class-wise fee analysis.

#### GET `/api/reports/payment-trends`
Get payment trends over time.

**Query Parameters:**
- `period` (optional): "daily" | "weekly" | "monthly" (default: "monthly")
- `from` (optional): Start date
- `to` (optional): End date

## Database Models

### Message Model
```javascript
{
  schoolId: ObjectId,
  sender: ObjectId,
  recipients: [{
    user: ObjectId,
    readAt: Date
  }],
  subject: String,
  content: String,
  messageType: String,
  priority: String,
  status: String,
  sentAt: Date,
  totalRecipients: Number,
  readCount: Number,
  recipientGroups: [...],
  createdAt: Date,
  updatedAt: Date
}
```

### FeeStructure Model
```javascript
{
  schoolId: ObjectId,
  createdBy: ObjectId,
  name: String,
  description: String,
  class: String,
  section: String,
  totalAmount: Number,
  installments: [{
    name: String,
    amount: Number,
    dueDate: Date,
    description: String,
    isOptional: Boolean,
    lateFeeAmount: Number,
    lateFeeAfter: Date
  }],
  academicYear: String,
  isActive: Boolean,
  appliedToStudents: Number,
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

### StudentFeeRecord Model
```javascript
{
  schoolId: ObjectId,
  studentId: ObjectId,
  feeStructureId: ObjectId,
  studentName: String,
  studentClass: String,
  studentSection: String,
  feeStructureName: String,
  totalAmount: Number,
  totalPaid: Number,
  totalPending: Number,
  installments: [...],
  payments: [...],
  status: String,
  nextDueDate: Date,
  overdueDays: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Routes

### Admin Navigation
The following routes have been added to the admin navigation:

- `/admin/messages` - Messages page
- `/admin/fees/structure` - Fee Structure management
- `/admin/fees/payments` - Fee Payments tracking
- `/admin/reports` - Reports and Analytics

### Component Structure
```
frontend/src/roles/admin/
├── components/
│   └── ClassSectionSelect.tsx    # Reusable class/section selector
├── pages/
│   ├── MessagesPage.tsx          # Messages management
│   ├── FeesPage.tsx              # Fees main page with tabs
│   ├── FeeStructureTab.tsx       # Fee structure creation/management
│   ├── FeePaymentsTab.tsx        # Fee payments tracking
│   └── ReportsPage.tsx           # Reports and analytics
```

## Security & Validation

### Authentication & Authorization
- All endpoints require authentication via JWT token
- Role-based access control: Only `ADMIN` and `SUPER_ADMIN` roles can access
- School context validation: Users can only access data from their school

### Validation Rules
- **Messages**: Title and body are required, class/section validation
- **Fee Structures**: Name, class, total amount, and installments are required
- **Installments**: Sum of installment amounts must equal total amount
- **Payments**: Amount, payment method, and installment name are required

### Rate Limiting
- Message sending is rate-limited to prevent spam
- Preview modal confirmation required before sending messages

## Testing

### Test Coverage
The implementation includes comprehensive tests covering:

1. **Unit Tests** for all backend endpoints
2. **Integration Tests** for complete workflows
3. **Error Handling Tests** for validation and edge cases
4. **Frontend Component Tests** for UI interactions

### Running Tests
```bash
# Backend tests
node backend/test-new-features.js

# Frontend tests (if configured)
npm test
```

## Migration Script

### Creating Student Fee Records
When a new fee structure is created with `applyToStudents: true`, the system automatically:

1. Queries all students matching the class/section criteria
2. Creates `StudentFeeRecord` documents for each student
3. Initializes installment tracking for each student
4. Updates the fee structure with the count of applied students

### Database Indexes
The following indexes have been added for optimal performance:

- **Messages**: `{ schoolId: 1, status: 1 }`, `{ sender: 1 }`, `{ createdAt: -1 }`
- **FeeStructures**: `{ schoolId: 1, class: 1, section: 1 }`, `{ isActive: 1 }`
- **StudentFeeRecords**: `{ schoolId: 1, studentId: 1 }`, `{ status: 1 }`, `{ nextDueDate: 1 }`

## Performance Considerations

### Database Optimization
- Aggregation pipelines for complex reports
- Proper indexing for query performance
- Pagination for large datasets

### Frontend Optimization
- Lazy loading of components
- Efficient state management
- Debounced search inputs

## Future Enhancements

### Planned Features
1. **Push Notifications**: FCM integration for real-time message delivery
2. **Email Integration**: Automated email notifications
3. **Online Payment Gateway**: Integration with payment processors
4. **Advanced Analytics**: More detailed reporting and insights
5. **Mobile App Integration**: API endpoints for mobile applications

### Scalability Considerations
- Database sharding for multi-tenant architecture
- Caching layer for frequently accessed data
- Background job processing for heavy operations
- API rate limiting and throttling

## Troubleshooting

### Common Issues

1. **Message Not Sending**
   - Check if students exist in the specified class/section
   - Verify school database connection
   - Check authentication and permissions

2. **Fee Structure Validation Errors**
   - Ensure installment amounts sum to total amount
   - Verify all required fields are provided
   - Check date formats for due dates

3. **Reports Not Loading**
   - Verify date range parameters
   - Check database connection
   - Ensure sufficient data exists

### Debug Mode
Enable debug logging by setting environment variables:
```bash
DEBUG=messages:*,fees:*,reports:*
```

## Support

For issues or questions regarding the new features:
1. Check the test files for usage examples
2. Review the API documentation above
3. Examine the database models for data structure
4. Check the frontend components for UI patterns
