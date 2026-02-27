const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Issue = require('./models/issue');
const connectDB = require('./config/db');

const clearAndSeed = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║     CLEAR DATABASE AND RESEED                    ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    // Connect
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Issue.deleteMany({});
    console.log('✅ Database cleared\n');

    // Seed users
    console.log('👥 Creating users...');
    const hashPassword = async (pwd) => bcrypt.hash(pwd, 10);

    const users = await User.insertMany([
      {
        fullName: 'Alice Manager',
        email: 'manager@aera.edu',
        username: 'manager_alice',
        password: await hashPassword('managerpass123'),
        role: 'manager'
      },
      {
        fullName: 'Bob Water Technician',
        email: 'tech_water@aera.edu',
        username: 'tech_water_bob',
        password: await hashPassword('waterpass123'),
        role: 'technician',
        technicianType: 'water'
      },
      {
        fullName: 'Charlie Electrician',
        email: 'tech_electric@aera.edu',
        username: 'tech_elec_charlie',
        password: await hashPassword('electpass123'),
        role: 'technician',
        technicianType: 'electricity'
      },
      {
        fullName: 'Diana Cleaning Technician',
        email: 'tech_clean@aera.edu',
        username: 'tech_clean_diana',
        password: await hashPassword('cleanpass123'),
        role: 'technician',
        technicianType: 'cleaning'
      },
      {
        fullName: 'Frank Data Collector',
        email: 'dc_frank@aera.edu',
        username: 'dc_frank',
        password: await hashPassword('dcpass123'),
        role: 'data_collector'
      }
    ]);

    console.log('✅ Created 5 users\n');

    // Seed issues
    console.log('🚨 Creating sample issues...');
    const dataCollector = users.find(u => u.role === 'data_collector');

    await Issue.insertMany([
      {
        submittedBy: dataCollector._id,
        userType: 'Data Collector',
        locationCategory: 'Building A',
        block: 'Block 1',
        floor: '2',
        roomNumber: '201',
        condition: 'Broken',
        problemLevel: 'High',
        priority: 'High',
        technicianType: 'electricity',
        issueType: 'Electrical',
        risk: 'High',
        analysisNotes: 'Light fixtures not working',
        status: 'submitted',
        data: { notes: 'Sample electrical issue' }
      },
      {
        submittedBy: dataCollector._id,
        userType: 'Data Collector',
        locationCategory: 'Building B',
        block: 'Block 2',
        floor: '1',
        roomNumber: '105',
        condition: 'Leaking',
        problemLevel: 'Medium',
        priority: 'Medium',
        technicianType: 'water',
        issueType: 'Water',
        risk: 'Moderate',
        analysisNotes: 'Tap leaking in bathroom',
        status: 'submitted',
        data: { notes: 'Sample water management issue' }
      },
      {
        submittedBy: dataCollector._id,
        userType: 'Data Collector',
        locationCategory: 'Building A',
        block: 'Block 1',
        floor: '3',
        roomNumber: '301',
        condition: 'Dirty',
        problemLevel: 'Low',
        priority: 'Low',
        technicianType: 'cleaning',
        issueType: 'Cleanliness',
        risk: 'Low',
        analysisNotes: 'Needs general cleaning',
        status: 'submitted',
        data: { notes: 'Sample cleaning issue' }
      }
    ]);

    console.log('✅ Created 3 sample issues\n');

    // Verify
    console.log('📋 DATABASE SUMMARY:');
    console.log('═════════════════════════════════');
    const userCount = await User.countDocuments();
    const issueCount = await Issue.countDocuments();
    console.log(`Total Users: ${userCount}`);
    console.log(`Total Issues: ${issueCount}\n`);

    const allUsers = await User.find().select('-password').lean();
    console.log('Users:');
    allUsers.forEach(u => {
      console.log(`  - ${u.username} (@${u.role})${u.technicianType ? ' [' + u.technicianType + ']' : ''}`);
    });

    console.log('\nIssues:');
    const allIssues = await Issue.find().lean();
    allIssues.forEach((i, idx) => {
      console.log(`  ${idx + 1}. Type: ${i.technicianType}, Status: ${i.status}, Priority: ${i.priority}`);
    });

    console.log('\n✅ Database successfully cleared and reseeded!\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

clearAndSeed();
