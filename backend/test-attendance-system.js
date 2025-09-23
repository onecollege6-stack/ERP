const axios = require('axios');
const mongoose = require('mongoose');

// Test the attendance system with sample data
async function testAttendanceSystem() {
  const baseURL = 'http://localhost:5050/api';
  
  // Test login first to get token
  const loginData = {
    identifier: 'admin@school.com', // Replace with actual admin credentials
    password: 'admin123'
  };

  try {
    console.log('🔐 Testing login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, loginData);
    const token = loginResponse.data.token;
    
    console.log('✅ Login successful');

    // Set up axios with auth header
    const api = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Test marking session attendance
    console.log('\n📝 Testing session attendance marking...');
    
    const attendanceData = {
      date: '2025-09-06',
      class: 'Class 5',
      section: 'A',
      session: 'morning',
      students: [
        {
          studentId: 'student_id_1', // Replace with actual student IDs
          userId: 'P-S-0001',
          status: 'present'
        },
        {
          studentId: 'student_id_2',
          userId: 'P-S-0002', 
          status: 'absent'
        },
        {
          studentId: 'student_id_3',
          userId: 'P-S-0003',
          status: 'half-day'
        }
      ]
    };

    const markResponse = await api.post('/attendance/mark-session', attendanceData);
    console.log('✅ Attendance marked successfully:', markResponse.data);

    // Test retrieving class attendance
    console.log('\n📊 Testing attendance retrieval...');
    
    const getResponse = await api.get('/attendance/class', {
      params: {
        class: 'Class 5',
        section: 'A', 
        date: '2025-09-06',
        session: 'morning'
      }
    });

    console.log('✅ Attendance retrieved successfully:');
    console.log(`Total records: ${getResponse.data.data.totalRecords}`);
    getResponse.data.data.records.forEach(record => {
      console.log(`- ${record.studentName} (${record.userId}): ${record.status}`);
    });

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Helper function to test with actual database connection
async function testWithDatabase() {
  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/institute_erp', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('📂 Connected to database');

    // Import models
    const User = require('./models/User');
    const Attendance = require('./models/Attendance');

    // Find some test students
    const students = await User.find({ 
      role: 'student',
      class: 'Class 5',
      section: 'A'
    }).limit(3);

    console.log(`Found ${students.length} test students`);

    if (students.length > 0) {
      console.log('\n🧪 Testing with real student data...');
      
      const testData = {
        date: '2025-09-06',
        class: 'Class 5', 
        section: 'A',
        session: 'morning',
        students: students.map((student, index) => ({
          studentId: student._id.toString(),
          userId: student.userId,
          status: ['present', 'absent', 'half-day'][index % 3]
        }))
      };

      console.log('Test data prepared:', JSON.stringify(testData, null, 2));
    }

    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

// Run tests
console.log('🚀 Starting Attendance System Tests\n');

// Uncomment the test you want to run:
// testAttendanceSystem();  // Test with API calls
testWithDatabase();       // Test with database connection

module.exports = { testAttendanceSystem, testWithDatabase };
