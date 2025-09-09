# Institute ERP System

A comprehensive Enterprise Resource Planning system designed for educational institutions, featuring role-based access control, automated user management, and comprehensive school administration capabilities.

## 🏗️ System Architecture

### User Roles & Hierarchy
```
Super Admin (Platform Level)
├── Creates Schools
├── Assigns School Admins
└── Manages Platform Settings

School Admin (School Level)
├── Manages Teachers
├── Admits Students
├── Manages Parents
└── School-specific Operations

Teacher (School Level)
├── View Student Information
├── Manage Attendance
├── Create Assignments
└── Grade Management

Student (School Level)
├── View Academic Information
├── Access Assignments
├── View Results
└── Communication Portal

Parent (School Level)
├── View Child's Progress
├── Access Academic Information
├── Communication with Teachers
└── Fee Management
```


## 🚀 Recent Integration & Features (August 2025)

### Backend (Node.js/Express/MongoDB Atlas)
- All models, controllers, and routes for Users, Assignments, Attendance, Results, Messages, Timetables, and Schools are set up.
- Role-based access control is enforced via middleware.
- API endpoints for CRUD and reporting are available and ready for frontend consumption.

### Frontend (React)
#### Admin & Teacher Features
- Assignments: Fully integrated with backend for listing, adding, and managing assignments.
- Attendance: Mark and view attendance, with real data from backend and stats.
- Results: Fetch and display results from backend, with error/loading states.
- Messages: Send and view messages using backend APIs.
- Timetable: Create and view timetables, all data persisted and fetched from backend.
- Reports: Analytics and reports now fetch real data from backend APIs.

#### Super Admin Features
- Add School: Connected to backend for school creation and management.
- School Management: (View/Update) can be integrated using the same API pattern.
- View Access: Connected to backend for real-time access matrix.

#### Dashboard
- Admin and Super Admin Dashboards: Ready to be connected to backend stats and analytics endpoints for real-time data.

### Integration Pattern
- All components use Axios-based API clients for backend communication.
- Each feature has loading and error state handling.
- All forms and tables refresh data after create/update/delete.
- All hardcoded data is replaced with backend data.

---

### Super Admin Features
- **School Management**: Create, update, and manage multiple schools
- **Admin Assignment**: Assign administrators to schools with specific permissions
- **Platform Overview**: View statistics across all schools
- **System Settings**: Configure platform-wide settings

### School Admin Features
- **Teacher Management**: Add, update, and manage teachers
- **Student Admission**: Complete student admission process with parent creation
- **Parent Management**: Manage parent accounts and relationships
- **School Configuration**: Set up classes, subjects, and academic years
- **User ID Generation**: Automatic generation of unique IDs for all users

### Automated Features
- **ID Generation**: 
  - Students: `SCHOOL_CODE + YEAR + SEQUENCE` (e.g., NPS2024001)
  - Teachers: `SCHOOL_CODE + T + SEQUENCE` (e.g., NPST001)
  - Parents: `SCHOOL_CODE + P + SEQUENCE` (e.g., NPSP001)
- **Password Generation**: Secure, role-specific passwords
- **User Creation**: Automated user account creation with proper relationships

## 🛠️ Technical Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Role-based access control**

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Role-specific applications**

### Mobile Apps (Separate)
- **React Native** for Students
- **React Native** for Parents

## 📊 Database Schema

### Core Models

#### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['superadmin', 'admin', 'teacher', 'student', 'parent'],
  schoolId: ObjectId (ref: School),
  isActive: Boolean,
  
  // Role-specific details
  adminDetails: { permissions: [String], assignedBy: ObjectId },
  teacherDetails: { employeeId: String, subjects: [String], qualification: String },
  studentDetails: { studentId: String, class: String, section: String, parentId: ObjectId },
  parentDetails: { parentId: String, relationship: String, occupation: String }
}
```

#### School Model
```javascript
{
  name: String,
  code: String (unique, e.g., "NPS"),
  address: { street, city, state, country, zipCode },
  contact: { phone, email, website },
  admin: ObjectId (ref: User),
  superAdmin: ObjectId (ref: User),
  settings: { academicYear, classes, subjects, workingDays, workingHours },
  stats: { totalStudents, totalTeachers, totalParents },
  features: { hasTransport, hasCanteen, hasLibrary, hasSports }
}
```

#### Admission Model
```javascript
{
  schoolId: ObjectId,
  admissionNumber: String (unique),
  academicYear: String,
  class: String,
  section: String,
  personalInfo: { firstName, lastName, dateOfBirth, gender },
  contactInfo: { address, phone, email, emergencyContact },
  academicInfo: { previousSchool, lastClassAttended, achievements },
  parentInfo: { father, mother, guardian },
  fees: { admissionFee, tuitionFee, totalAmount, paymentStatus },
  status: ['pending', 'approved', 'rejected', 'admitted', 'withdrawn']
}
```

## 🔐 Authentication & Authorization

### JWT Token Structure
```javascript
{
  id: "user_id",
  role: "user_role",
  schoolId: "school_id" // for school-specific users
}
```

### Permission Levels
- **Super Admin**: Full platform access
- **School Admin**: School-specific operations
- **Teacher**: Class and student management
- **Student**: Personal academic information
- **Parent**: Child-related information

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (Super Admin only)

### Schools
- `POST /api/schools` - Create school (Super Admin)
- `GET /api/schools` - Get all schools (Super Admin)
- `GET /api/schools/:id` - Get school details
- `PUT /api/schools/:id` - Update school
- `PATCH /api/schools/:id/toggle-status` - Toggle school status

### Users
- `POST /api/users/teachers` - Add teacher
- `POST /api/users/students` - Add student with parent
- `POST /api/users/parents` - Add parent
- `GET /api/users/role/:role` - Get users by role
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/reset-password` - Reset password
- `PATCH /api/users/:id/toggle-status` - Toggle user status

### Admissions
- `POST /api/admissions` - Create admission application
- `GET /api/admissions` - Get admissions with filters
- `GET /api/admissions/:id` - Get admission details
- `PATCH /api/admissions/:id/approve` - Approve admission
- `PATCH /api/admissions/:id/reject` - Reject admission

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file with:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret_key
# PORT=5000
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/institute_erp
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
NODE_ENV=development
```

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Use PM2 or similar process manager
3. Configure reverse proxy (Nginx)
4. Set up SSL certificates

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Deploy to static hosting (Vercel, Netlify, or traditional hosting)
3. Configure environment variables

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Role-based Access**: Granular permission system
- **Input Validation**: Request data sanitization
- **CORS Protection**: Cross-origin request handling
- **Rate Limiting**: API request throttling (recommended)

## 📈 Future Enhancements

- **Real-time Notifications**: WebSocket integration
- **File Management**: Document upload and storage
- **Payment Integration**: Online fee collection
- **Analytics Dashboard**: Advanced reporting
- **Mobile API**: Dedicated mobile endpoints
- **Multi-language Support**: Internationalization
- **Advanced Search**: Elasticsearch integration
- **Audit Logging**: Comprehensive activity tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
- **v1.1.0**: Enhanced user management and admission system
- **v1.2.0**: Role-based access control and security improvements
