require('dotenv').config();
const mongoose = require('mongoose');
const SchoolDatabaseManager = require('../utils/databaseManager');

// Comprehensive data for generating realistic student records based on ManageUsers.tsx form fields
const firstNames = {
  male: [
    'Aarav', 'Arjun', 'Aditya', 'Anish', 'Akash', 'Arnav', 'Aman', 'Ayaan', 'Atharv', 'Abhay',
    'Harsh', 'Ishaan', 'Karan', 'Krishna', 'Laksh', 'Manish', 'Nikhil', 'Om', 'Pranav', 'Raj',
    'Rohan', 'Sahil', 'Shaan', 'Tanish', 'Utkarsh', 'Vedant', 'Vihaan', 'Yash', 'Zain', 'Dev',
    'Advait', 'Agastya', 'Aniket', 'Armaan', 'Daksh', 'Darsh', 'Devansh', 'Dhruv', 'Gagan', 'Jai'
  ],
  female: [
    'Aadhya', 'Ananya', 'Aisha', 'Aria', 'Avni', 'Diya', 'Ira', 'Kavya', 'Kiara', 'Mira',
    'Nisha', 'Priya', 'Rhea', 'Saanvi', 'Sara', 'Tara', 'Veda', 'Zara', 'Ishita', 'Meera',
    'Pooja', 'Riya', 'Shreya', 'Siya', 'Sneha', 'Suhana', 'Tanvi', 'Urvi', 'Vaanya', 'Yara',
    'Aditi', 'Advika', 'Anika', 'Arya', 'Divya', 'Gayatri', 'Isha', 'Jiya', 'Khushi', 'Myra'
  ]
};

const lastNames = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Agarwal', 'Reddy', 'Nair', 'Iyer', 'Joshi',
  'Mehta', 'Shah', 'Rao', 'Chopra', 'Malhotra', 'Bansal', 'Arora', 'Saxena', 'Verma', 'Bhatia',
  'Khanna', 'Jain', 'Sinha', 'Mishra', 'Pandey', 'Tiwari', 'Dubey', 'Thakur', 'Chauhan', 'Yadav',
  'Kapoor', 'Agnihotri', 'Bhardwaj', 'Chandra', 'Desai', 'Gandhi', 'Goyal', 'Hegde', 'Kaul', 'Menon'
];

const fatherNames = [
  'Rajesh', 'Suresh', 'Mahesh', 'Ramesh', 'Dinesh', 'Naresh', 'Umesh', 'Mukesh', 'Rakesh', 'Hitesh',
  'Ashok', 'Vinod', 'Manoj', 'Anil', 'Sunil', 'Kapil', 'Rahul', 'Rohit', 'Amit', 'Ajit',
  'Deepak', 'Sanjay', 'Vijay', 'Ajay', 'Akash', 'Prakash', 'Vikash', 'Subhash', 'Aakash', 'Gaurav'
];

const motherNames = [
  'Sunita', 'Geeta', 'Sita', 'Rita', 'Anita', 'Kavita', 'Lalita', 'Mamta', 'Shanta', 'Kanta',
  'Priya', 'Maya', 'Jaya', 'Vijaya', 'Sushma', 'Padma', 'Lakshmi', 'Saraswati', 'Radha', 'Meera',
  'Asha', 'Usha', 'Nisha', 'Alka', 'Deepa', 'Rekha', 'Seema', 'Neema', 'Reema', 'Shalini'
];

const castes = ['Brahmin', 'Kshatriya', 'Vaishya', 'Lingayat', 'Kuruba', 'Vokkaliga', 'Reddy', 'Naidu', 'Gowda', 'Setty'];
const socialCategories = ['General', 'OBC', 'SC', 'ST', '2A', '2B', '3A', '3B'];
const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain'];
const motherTongues = ['Kannada', 'Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam', 'Marathi', 'Gujarati'];
const occupations = ['Farmer', 'Teacher', 'Engineer', 'Doctor', 'Businessman', 'Government Employee', 'Private Employee', 'Shop Owner', 'Driver', 'Labour'];
const educationLevels = ['Primary', 'SSLC', 'PUC', 'Degree', 'Post Graduate', 'Professional'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const districts = ['Bangalore Urban', 'Bangalore Rural', 'Mysore', 'Mandya', 'Hassan', 'Tumkur', 'Kolar', 'Chikkaballapur'];
const talukas = ['Bangalore North', 'Bangalore South', 'Anekal', 'Devanahalli', 'Doddaballapur', 'Hosakote'];

// Subject mappings for different classes
const subjectsByClass = {
  'LKG': ['English', 'Kannada', 'Mathematics', 'Environmental Studies', 'Art & Craft', 'Physical Education'],
  'UKG': ['English', 'Kannada', 'Mathematics', 'Environmental Studies', 'Art & Craft', 'Physical Education'],
  '1': ['English', 'Kannada', 'Mathematics', 'Environmental Studies', 'Art & Craft', 'Physical Education'],
  '2': ['English', 'Kannada', 'Mathematics', 'Environmental Studies', 'Art & Craft', 'Physical Education'],
  '3': ['English', 'Kannada', 'Mathematics', 'Environmental Studies', 'Science', 'Social Studies', 'Art & Craft', 'Physical Education'],
  '4': ['English', 'Kannada', 'Mathematics', 'Environmental Studies', 'Science', 'Social Studies', 'Art & Craft', 'Physical Education'],
  '5': ['English', 'Kannada', 'Mathematics', 'Science', 'Social Studies', 'Art & Craft', 'Physical Education'],
  '6': ['English', 'Kannada', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Computer Science', 'Physical Education'],
  '7': ['English', 'Kannada', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Computer Science', 'Physical Education'],
  '8': ['English', 'Kannada', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Computer Science', 'Physical Education'],
  '9': ['English', 'Kannada', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Computer Science', 'Physical Education'],
  '10': ['English', 'Kannada', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Computer Science', 'Physical Education'],
  '11': ['English', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Economics', 'Business Studies'],
  '12': ['English', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Economics', 'Business Studies']
};

const teacherSubjects = [
  'English', 'Kannada', 'Hindi', 'Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology',
  'Social Studies', 'History', 'Geography', 'Economics', 'Business Studies', 'Computer Science',
  'Physical Education', 'Art & Craft'
];

// Generate random phone number
const generatePhoneNumber = () => {
  const prefixes = ['98', '99', '97', '96', '95', '94', '93', '92', '91', '90'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const remaining = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `${prefix}${remaining}`;
};

// Generate random Aadhaar number
const generateAadhaar = () => {
  return Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
};

// Generate random email
const generateEmail = (firstName, lastName, role, classNum = '', section = '') => {
  const domain = '@school.edu.in';
  if (role === 'student') {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${classNum}${section.toLowerCase()}${domain}`;
  } else {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${domain}`;
  }
};

// Generate comprehensive student data using all ManageUsers.tsx form fields
const generateStudentData = (classNum, section, studentNumber, schoolCode) => {
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const firstName = firstNames[gender][Math.floor(Math.random() * firstNames[gender].length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const fullName = `${firstName} ${lastName}`;
  
  // Calculate age based on class
  let ageYears = 3; // Default for LKG
  if (classNum === 'UKG') ageYears = 4;
  else if (classNum !== 'LKG' && classNum !== 'UKG') {
    ageYears = parseInt(classNum) + 5;
  }
  
  const birthYear = new Date().getFullYear() - ageYears;
  const birthMonth = Math.floor(Math.random() * 12);
  const birthDay = Math.floor(Math.random() * 28) + 1;
  const dateOfBirth = new Date(birthYear, birthMonth, birthDay).toISOString().split('T')[0];
  
  const fatherName = fatherNames[Math.floor(Math.random() * fatherNames.length)] + ' ' + lastName;
  const motherName = motherNames[Math.floor(Math.random() * motherNames.length)] + ' ' + lastName;
  
  const userId = `${schoolCode.toUpperCase()}-S-${String(studentNumber).padStart(4, '0')}`;
  const admissionNumber = `ADM${new Date().getFullYear()}${String(studentNumber).padStart(4, '0')}`;
  const enrollmentNo = `ENR${String(studentNumber).padStart(6, '0')}`;
  
  const caste = castes[Math.floor(Math.random() * castes.length)];
  const religion = religions[Math.floor(Math.random() * religions.length)];
  const socialCategory = socialCategories[Math.floor(Math.random() * socialCategories.length)];
  const motherTongue = motherTongues[Math.floor(Math.random() * motherTongues.length)];
  const district = districts[Math.floor(Math.random() * districts.length)];
  const taluka = talukas[Math.floor(Math.random() * talukas.length)];
  
  return {
    // Core identification
    userId: userId,
    _id: userId, // Use userId as _id for consistency
    
    // Generated Information
    generatedPassword: 'student123', // Default password
    
    // Basic Information (SATS Standard)
    enrollmentNo: enrollmentNo,
    tcNo: `TC${String(studentNumber).padStart(6, '0')}`,
    role: 'student',
    
    // Admission Details (SATS Standard)
    class: classNum,
    academicYear: '2024-2025',
    section: section,
    mediumOfInstruction: 'English',
    motherTongue: motherTongue,
    motherTongueOther: motherTongue === 'Other' ? 'Konkani' : '',
    
    // Student Details (SATS Standard)
    name: fullName,
    studentNameKannada: `${firstName} ${lastName}`, // Simplified Kannada name
    firstName: firstName,
    lastName: lastName,
    dateOfBirth: dateOfBirth,
    ageYears: ageYears,
    ageMonths: Math.floor(Math.random() * 12),
    gender: gender,
    
    // Family Details (SATS Standard)
    fatherName: fatherName,
    fatherNameKannada: fatherName, // Simplified
    fatherAadhaar: generateAadhaar(),
    motherName: motherName,
    motherNameKannada: motherName, // Simplified
    motherAadhaar: generateAadhaar(),
    
    // Identity Documents (SATS Standard)
    studentAadhaar: generateAadhaar(),
    studentCasteCertNo: `CC${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
    fatherCasteCertNo: `FCC${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
    motherCasteCertNo: `MCC${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
    
    // Caste and Category (SATS Standard)
    studentCaste: caste,
    studentCasteOther: '',
    fatherCaste: caste,
    fatherCasteOther: '',
    motherCaste: caste,
    motherCasteOther: '',
    socialCategory: socialCategory,
    socialCategoryOther: '',
    religion: religion,
    religionOther: '',
    specialCategory: 'None',
    specialCategoryOther: '',
    
    // Economic Status (SATS Standard)
    belongingToBPL: Math.random() > 0.7 ? 'Yes' : 'No',
    bplCardNo: Math.random() > 0.7 ? `BPL${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}` : '',
    bhagyalakshmiBondNo: gender === 'female' ? `BL${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}` : '',
    
    // Special Needs (SATS Standard)
    disability: Math.random() > 0.95 ? 'Visual Impairment' : 'Not Applicable',
    disabilityOther: '',
    
    // Address Information (SATS Standard)
    address: `House No. ${Math.floor(Math.random() * 999) + 1}, Ward No. ${Math.floor(Math.random() * 50) + 1}`,
    cityVillageTown: `Village ${Math.floor(Math.random() * 100) + 1}`,
    locality: `Locality ${Math.floor(Math.random() * 20) + 1}`,
    taluka: taluka,
    district: district,
    pinCode: String(Math.floor(Math.random() * 900000) + 100000),
    state: 'Karnataka',
    
    // Communication Details (SATS Standard)
    studentMobile: Math.random() > 0.8 ? generatePhoneNumber() : '',
    studentEmail: generateEmail(firstName, lastName, 'student', classNum, section),
    fatherMobile: generatePhoneNumber(),
    fatherEmail: `${firstName.toLowerCase()}.father@email.com`,
    motherMobile: generatePhoneNumber(),
    motherEmail: `${firstName.toLowerCase()}.mother@email.com`,
    
    // School and Banking (SATS Standard)
    schoolAdmissionDate: new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    bankName: ['SBI', 'Canara Bank', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'][Math.floor(Math.random() * 5)],
    bankAccountNo: String(Math.floor(Math.random() * 10000000000000) + 1000000000000),
    bankIFSC: 'SBIN0001234',
    
    // Legacy Compatibility Fields
    email: generateEmail(firstName, lastName, 'student', classNum, section),
    phone: generatePhoneNumber(),
    city: district,
    nationality: 'Indian',
    bloodGroup: bloodGroups[Math.floor(Math.random() * bloodGroups.length)],
    
    // Family Information (Legacy)
    fatherPhone: generatePhoneNumber(),
    fatherOccupation: occupations[Math.floor(Math.random() * occupations.length)],
    motherPhone: generatePhoneNumber(),
    motherOccupation: occupations[Math.floor(Math.random() * occupations.length)],
    guardianName: Math.random() > 0.8 ? fatherName : '',
    guardianRelation: Math.random() > 0.8 ? 'Father' : '',
    fatherEducation: educationLevels[Math.floor(Math.random() * educationLevels.length)],
    motherEducation: educationLevels[Math.floor(Math.random() * educationLevels.length)],
    familyIncome: String(Math.floor(Math.random() * 500000) + 100000),
    
    // Emergency Contact
    emergencyContactName: fatherName,
    emergencyContactPhone: generatePhoneNumber(),
    emergencyContactRelation: 'Father',
    alternatePhone: generatePhoneNumber(),
    parentEmail: `${firstName.toLowerCase()}.parent@email.com`,
    
    // Academic Information (Legacy)
    rollNumber: String(studentNumber),
    admissionNumber: admissionNumber,
    admissionDate: new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    previousSchool: Math.random() > 0.7 ? 'Previous School Name' : '',
    previousClass: classNum === 'LKG' ? '' : String(parseInt(classNum) - 1),
    tcNumber: `TC${String(studentNumber).padStart(6, '0')}`,
    migrationCertificate: '',
    
    // Student Details for compatibility
    studentDetails: {
      studentId: userId,
      class: classNum,
      section: section,
      rollNumber: String(studentNumber),
      academic: {
        currentClass: classNum,
        currentSection: section,
        academicYear: '2024-25',
        admissionDate: new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1)
      }
    },
    
    // Status fields
    isActive: true,
    createdAt: new Date().toISOString(),
    schoolCode: schoolCode
  };
};

// Generate comprehensive teacher data using all ManageUsers.tsx form fields
const generateTeacherData = (subject, teacherNumber, schoolCode) => {
  const gender = Math.random() > 0.4 ? 'female' : 'male'; // More female teachers
  const firstName = firstNames[gender][Math.floor(Math.random() * firstNames[gender].length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const fullName = `${firstName} ${lastName}`;
  
  const experience = Math.floor(Math.random() * 20) + 1;
  const ageYears = experience + 25;
  const userId = `${schoolCode.toUpperCase()}-T-${String(teacherNumber).padStart(4, '0')}`;
  const employeeId = `EMP${String(teacherNumber).padStart(4, '0')}`;
  
  const qualification = ['B.Ed', 'M.Ed', 'B.A B.Ed', 'B.Sc B.Ed', 'M.A', 'M.Sc', 'M.Tech', 'Ph.D'][Math.floor(Math.random() * 8)];
  const department = subject === 'Physical Education' ? 'Sports' : subject === 'Art & Craft' ? 'Arts' : 'Academic';
  
  return {
    // Core identification
    userId: userId,
    _id: userId,
    
    // Basic Information
    role: 'teacher',
    name: fullName,
    firstName: firstName,
    lastName: lastName,
    email: generateEmail(firstName, lastName, 'teacher'),
    phone: generatePhoneNumber(),
    
    // Personal Information
    dateOfBirth: new Date(new Date().getFullYear() - ageYears, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    gender: gender,
    nationality: 'Indian',
    bloodGroup: bloodGroups[Math.floor(Math.random() * bloodGroups.length)],
    
    // Teacher specific fields
    subjects: [subject],
    qualification: qualification,
    experience: experience,
    employeeId: employeeId,
    department: department,
    designation: experience > 15 ? 'Principal' : experience > 10 ? 'Senior Teacher' : experience > 5 ? 'Teacher' : 'Junior Teacher',
    joiningDate: new Date(new Date().getFullYear() - experience, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    
    // Address Information
    address: `House No. ${Math.floor(Math.random() * 999) + 1}, Teacher Colony`,
    city: 'Bangalore',
    state: 'Karnataka',
    pinCode: '560001',
    district: 'Bangalore Urban',
    
    // Teacher Details for compatibility
    teacherDetails: {
      employeeId: employeeId,
      subjects: [subject],
      qualification: qualification,
      experience: experience,
      department: department
    },
    
    // Personal details
    religion: religions[Math.floor(Math.random() * religions.length)],
    caste: castes[Math.floor(Math.random() * castes.length)],
    
    // Status fields
    isActive: true,
    createdAt: new Date().toISOString(),
    schoolCode: schoolCode
  };
};

// Main function to populate school_p database
async function populateSchoolP() {
  try {
    console.log('🚀 Starting School P Database Population');
    console.log('=========================================');
    
    const schoolCode = 'P'; // Target school_p database
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    console.log('🔗 Connecting to MongoDB...');
    console.log(`📍 URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    
    // Connect to MongoDB using the URI from .env
    await mongoose.connect(mongoUri);
    
    // Initialize database manager
    await SchoolDatabaseManager.initialize();
    const connection = await SchoolDatabaseManager.getSchoolConnection(schoolCode);
    console.log('✅ Connected to school_p database');
    
    // Clear existing data
    console.log('🧹 Clearing existing student and teacher data...');
    await connection.collection('students').deleteMany({});
    await connection.collection('teachers').deleteMany({});
    
    let totalStudents = 0;
    let totalTeachers = 0;
    
    // Define all classes and sections
    const classes = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const sections = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    console.log('👥 Creating teachers...');
    
    // Create teachers for each subject
    const createdTeachers = [];
    let teacherNumber = 1;
    
    for (const subject of teacherSubjects) {
      console.log(`📚 Creating teacher for ${subject}...`);
      const teacherData = generateTeacherData(subject, teacherNumber, schoolCode);
      
      await connection.collection('teachers').insertOne(teacherData);
      createdTeachers.push(teacherData);
      totalTeachers++;
      teacherNumber++;
    }
    
    console.log('👨‍🎓 Creating students...');
    
    // Create students for each class and section (12 students per section)
    let studentNumber = 1;
    
    for (const className of classes) {
      console.log(`📖 Creating students for Class ${className}...`);
      
      for (const section of sections) {
        console.log(`  📝 Creating students for Section ${section}...`);
        
        // Create 12 students per section instead of 10 for more variety
        for (let i = 1; i <= 12; i++) {
          const studentData = generateStudentData(className, section, studentNumber, schoolCode);
          
          await connection.collection('students').insertOne(studentData);
          totalStudents++;
          studentNumber++;
        }
        
        console.log(`    ✅ Created 12 students for Class ${className} Section ${section}`);
      }
    }
    
    console.log('\n🎉 Database population completed!');
    console.log('================================');
    console.log(`📊 Total students created: ${totalStudents}`);
    console.log(`👨‍🏫 Total teachers created: ${totalTeachers}`);
    console.log(`🏫 Classes: ${classes.join(', ')}`);
    console.log(`📝 Sections per class: ${sections.join(', ')}`);
    console.log(`👥 Students per section: 12`);
    console.log(`🗃️ Database: school_p`);
    console.log(`📋 Collections populated: students, teachers`);
    console.log('\n📈 Summary:');
    console.log(`   • ${classes.length} classes from LKG to 12th`);
    console.log(`   • ${sections.length} sections (A-F) per class`);
    console.log(`   • 12 students per section`);
    console.log(`   • ${teacherSubjects.length} teachers for different subjects`);
    console.log(`   • Comprehensive data using all ManageUsers.tsx form fields`);
    
    // Close connections
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error populating database:', error);
    process.exit(1);
  }
}

// Run the population
populateSchoolP()
  .then(() => {
    console.log('🏁 Population script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Population script failed:', error);
    process.exit(1);
  });
