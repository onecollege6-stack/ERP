const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const School = require('../models/School');
require('dotenv').config();

const seedSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = ;

    const connection = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    });

    console.log('Connected to MongoDB');

    // Explicitly set the database to ensure correct insertion
    const db = connection.connection.useDb('institute_erp');

    // Clear the users collection before seeding
    await db.collection('users').deleteMany({});
    console.log('✅ Cleared the users collection');

    // Check if system school exists, create if not
    let systemSchool = await db.collection('schools').findOne({ code: 'SYSTEM' });

    if (!systemSchool) {
      systemSchool = {
        code: 'SYSTEM',
        name: 'System Administration',
        address: {
          street: 'System Admin Address',
          city: 'System City',
          state: 'System State',
          country: 'India',
          zipCode: '000000'
        },
        contact: {
          phone: '0000000000',
          email: 'system@erp.com',
          website: 'https://system.erp.com'
        },
        principal: {
          name: 'System Principal',
          email: 'system@erp.com',
          phone: '0000000000'
        },
        settings: {
          academicYear: {
            currentYear: '2024-25',
            startDate: new Date('2024-04-01'),
            endDate: new Date('2025-03-31')
          },
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          schoolTimings: {
            startTime: '00:00',
            endTime: '23:59'
          },
          maxStudentsPerClass: 1,
          gradeSystem: 'percentage'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('schools').insertOne(systemSchool);
      console.log('✅ System school created');
    } else {
      console.log('✅ System school already exists');
    }

    // Check if superadmin already exists
    const existingSuperAdmin = await db.collection('users').findOne({ 
      email: 'super@erp.com',
      role: 'superadmin' 
    });

    if (existingSuperAdmin) {
      console.log('SuperAdmin already exists!');
      console.log('Email:', existingSuperAdmin.email);
      console.log('Role:', existingSuperAdmin.role);
      return;
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('super123', saltRounds);

    // Create SuperAdmin user with validation bypass for self-reference issue
    const superAdminData = {
      userId: 'SUPER_ADMIN_001',
      name: {
        firstName: 'Super',
        lastName: 'Admin',
        displayName: 'Super Admin'
      },
      email: 'super@erp.com',
      password: hashedPassword,
      passwordChangeRequired: false, // Set to false for convenience
      role: 'superadmin',
      contact: {
        primaryPhone: '9999999999',
        emergencyContact: {
          name: 'System Administrator',
          relationship: 'Technical',
          phone: '9999999999'
        }
      },
      address: {
        permanent: {
          street: 'System Admin Address',
          city: 'Admin City',
          state: 'Admin State',
          country: 'India',
          pincode: '000000'
        }
      },
      identity: {
        aadharNumber: '999999999999',
        panNumber: 'ZZZZZ9999Z'
      },
      schoolCode: 'SYSTEM',
      schoolId: systemSchool._id,
      schoolAccess: {
        joinedDate: new Date(),
        status: 'active',
        accessLevel: 'full',
        permissions: ['all']
      },
      isActive: true,
      isVerified: true,
      profile: {
        profilePicture: null,
        bio: 'System SuperAdmin with full access to all features',
        personalDetails: {
          dateOfBirth: new Date('1990-01-01'),
          gender: 'other',
          bloodGroup: 'O+',
          nationality: 'Indian'
        }
      },
      systemAccess: {
        canManageSchools: true,
        canManageUsers: true,
        canViewReports: true,
        canManageSystem: true
      },
      loginHistory: [],
      activeSessions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert superadmin into the correct database and collection
    const result = await db.collection('users').insertOne(superAdminData);
    const superAdminId = result.insertedId;

    console.log('\n✅ SuperAdmin created successfully!');
    console.log('==========================================');
    console.log('Email: super@erp.com');
    console.log('Password: super123');
    console.log('Role: superadmin');
    console.log('User ID:', superAdminData.userId);
    console.log('Database ID:', superAdminId);
    console.log('==========================================');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nYou can now login with:');
    console.log('Email: super@erp.com');
    console.log('Password: super123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);

    if (error.code === 11000) {
      console.log('\n⚠️  Duplicate key error - some data might already exist');
      console.log('Details:', error.keyPattern);
    }
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Run the seeding
console.log('🌱 Starting database seeding...');
console.log('Creating SuperAdmin and sample data...\n');

seedSuperAdmin();
