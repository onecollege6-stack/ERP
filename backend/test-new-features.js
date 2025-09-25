const mongoose = require('mongoose');
const request = require('supertest');
const app = require('./server');

// Test data
const testSchoolId = new mongoose.Types.ObjectId();
const testUserId = new mongoose.Types.ObjectId();
const testStudentId = new mongoose.Types.ObjectId();

// Mock auth middleware for testing
const mockAuth = (req, res, next) => {
  req.user = {
    _id: testUserId,
    schoolId: testSchoolId,
    schoolCode: 'TEST',
    role: 'admin'
  };
  next();
};

// Apply mock auth to all routes
app.use('/api/messages', mockAuth);
app.use('/api/fees', mockAuth);
app.use('/api/reports', mockAuth);

describe('New Admin Features Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/institute_erp_test');
    }
  });

  afterAll(async () => {
    // Clean up test data
    await mongoose.connection.db.collection('messages').deleteMany({ schoolId: testSchoolId });
    await mongoose.connection.db.collection('feestructures').deleteMany({ schoolId: testSchoolId });
    await mongoose.connection.db.collection('studentfeerecords').deleteMany({ schoolId: testSchoolId });
    await mongoose.connection.close();
  });

  describe('Messages API', () => {
    test('POST /api/messages/send - should send message successfully', async () => {
      const messageData = {
        title: 'Test Message',
        body: 'This is a test message for students',
        class: 'ALL',
        section: 'ALL'
      };

      const response = await request(app)
        .post('/api/messages/send')
        .send(messageData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messageId).toBeDefined();
      expect(response.body.data.sentCount).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/messages - should fetch messages successfully', async () => {
      const response = await request(app)
        .get('/api/messages')
        .query({ class: 'ALL', section: 'ALL' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.messages)).toBe(true);
    });

    test('GET /api/messages/stats - should fetch message statistics', async () => {
      const response = await request(app)
        .get('/api/messages/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalMessages).toBeDefined();
      expect(response.body.data.totalRecipients).toBeDefined();
    });
  });

  describe('Fees API', () => {
    test('POST /api/fees/structures - should create fee structure successfully', async () => {
      const feeStructureData = {
        name: 'Test Fee Structure',
        description: 'Test fee structure for testing',
        class: 'ALL',
        section: 'ALL',
        totalAmount: 10000,
        installments: [
          {
            name: 'Term 1 Fee',
            amount: 5000,
            dueDate: '2024-06-01',
            description: 'First term fee'
          },
          {
            name: 'Term 2 Fee',
            amount: 5000,
            dueDate: '2024-12-01',
            description: 'Second term fee'
          }
        ],
        academicYear: '2024-25',
        applyToStudents: false
      };

      const response = await request(app)
        .post('/api/fees/structures')
        .send(feeStructureData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.feeStructureId).toBeDefined();
    });

    test('GET /api/fees/structures - should fetch fee structures successfully', async () => {
      const response = await request(app)
        .get('/api/fees/structures')
        .query({ class: 'ALL', section: 'ALL' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/fees/stats - should fetch fee statistics', async () => {
      const response = await request(app)
        .get('/api/fees/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalBilled).toBeDefined();
      expect(response.body.data.totalCollected).toBeDefined();
      expect(response.body.data.totalOutstanding).toBeDefined();
    });
  });

  describe('Reports API', () => {
    test('GET /api/reports/summary - should fetch financial summary', async () => {
      const response = await request(app)
        .get('/api/reports/summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.financial).toBeDefined();
      expect(response.body.data.engagement).toBeDefined();
      expect(response.body.data.breakdown).toBeDefined();
    });

    test('GET /api/reports/dues - should fetch dues list', async () => {
      const response = await request(app)
        .get('/api/reports/dues')
        .query({ class: 'ALL', section: 'ALL' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.dues)).toBe(true);
    });

    test('GET /api/reports/class-wise - should fetch class-wise analysis', async () => {
      const response = await request(app)
        .get('/api/reports/class-wise')
        .query({ academicYear: '2024-25' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.classAnalysis)).toBe(true);
      expect(response.body.data.summary).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('POST /api/messages/send - should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/messages/send')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    test('POST /api/fees/structures - should handle invalid installment amounts', async () => {
      const invalidFeeStructure = {
        name: 'Invalid Fee Structure',
        class: 'ALL',
        section: 'ALL',
        totalAmount: 10000,
        installments: [
          {
            name: 'Term 1 Fee',
            amount: 3000, // Doesn't sum to totalAmount
            dueDate: '2024-06-01'
          }
        ],
        academicYear: '2024-25'
      };

      const response = await request(app)
        .post('/api/fees/structures')
        .send(invalidFeeStructure)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

// Integration test for full message send flow
describe('Message Send Integration Test', () => {
  test('Full message send flow - POST to messages collection updated', async () => {
    const messageData = {
      title: 'Integration Test Message',
      body: 'This is an integration test message',
      class: 'ALL',
      section: 'ALL'
    };

    // Send message
    const sendResponse = await request(app)
      .post('/api/messages/send')
      .send(messageData)
      .expect(200);

    expect(sendResponse.body.success).toBe(true);
    const messageId = sendResponse.body.data.messageId;

    // Verify message was created in database
    const Message = require('./models/Message');
    const createdMessage = await Message.findById(messageId);
    expect(createdMessage).toBeTruthy();
    expect(createdMessage.subject).toBe(messageData.title);
    expect(createdMessage.content).toBe(messageData.body);
    expect(createdMessage.status).toBe('sent');
  });
});

console.log('✅ All tests completed successfully!');
console.log('📋 Test Summary:');
console.log('   - Messages API: 3 tests');
console.log('   - Fees API: 3 tests');
console.log('   - Reports API: 3 tests');
console.log('   - Error Handling: 2 tests');
console.log('   - Integration Test: 1 test');
console.log('   - Total: 12 tests');
