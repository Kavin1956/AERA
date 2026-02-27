// ============================================================
// SEED AND VERIFY SCRIPT
// This script seeds sample data to MongoDB and verifies it
// Usage: node backend/seedAndVerify.js
// ============================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Issue = require('./models/issue');

// Import connectDB
const connectDB = require('./config/db');

const seedAndVerify = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║     AERA DATABASE SEED & VERIFICATION TOOL       ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    // Step 1: Connect to MongoDB
    console.log('📡 Step 1: Connecting to MongoDB...');
    console.log('MONGO_URI:', process.env.MONGO_URI.substring(0, 50) + '...');
    console.log('MONGO_FALLBACK_URI:', process.env.MONGO_FALLBACK_URI || 'Not set\n');

    await connectDB();
    console.log('✅ Successfully connected to MongoDB!\n');

    // Step 2: Get current database name and collections
    console.log('📊 Step 2: Checking database status...');
    const dbName = mongoose.connection.db.name;
    console.log(`Database name: ${dbName}`);
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Collections: ${collections.map(c => c.name).join(', ') || 'None'}\n`);

    // Step 3: Count existing data
    console.log('📈 Step 3: Counting existing data...');
    const userCount = await User.countDocuments();
    const issueCount = await Issue.countDocuments();
    console.log(`Existing users: ${userCount}`);
    console.log(`Existing issues: ${issueCount}\n`);

    // Step 4: Generate and seed users if needed
    console.log('👥 Step 4: Seeding users...');

    const hashPassword = async (pwd) => bcrypt.hash(pwd, 10);

    const usersToCreate = [
      {
        fullName: 'Alice Manager',
        email: 'manager@aera.edu',
        username: 'manager_alice',
        password: await hashPassword('managerpass123'),
        role: 'manager'
      },
      {
        fullName: 'Bob Water Manager',
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
        fullName: 'Diana Cleaner',
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
      },
      {
        fullName: 'Grace Data Collector',
        email: 'dc_grace@aera.edu',
        username: 'dc_grace',
        password: await hashPassword('dcpass123'),
        role: 'data_collector'
      }
    ];

    let usersCreated = 0;
    let usersSkipped = 0;
    let createdUserIds = [];

    for (const userData of usersToCreate) {
      const existingUser = await User.findOne({ username: userData.username });
      if (existingUser) {
        console.log(`  ⏭️  ${userData.username} already exists (skipped)`);
        usersSkipped++;
        createdUserIds.push(existingUser._id);
      } else {
        const newUser = await User.create(userData);
        console.log(`  ✅ Created ${userData.role}: ${userData.fullName}`);
        usersCreated++;
        createdUserIds.push(newUser._id);
      }
    }

    console.log(`\nUsers Status: ${usersCreated} created, ${usersSkipped} already existed\n`);

    // Step 5: Seed sample issues
    console.log('🚨 Step 5: Seeding sample issues...');

    // Get the manager and a data collector
    const manager = await User.findOne({ role: 'manager' });
    const dataCollector = await User.findOne({ role: 'data_collector' });

    const issuesToCreate = [
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
    ];

    let issuesCreated = 0;

    for (const issueData of issuesToCreate) {
      const existingIssue = await Issue.findOne({
        submittedBy: issueData.submittedBy,
        roomNumber: issueData.roomNumber,
        technicianType: issueData.technicianType
      });

      if (!existingIssue) {
        await Issue.create(issueData);
        console.log(`  ✅ Created issue: ${issueData.issueType} in ${issueData.locationCategory}`);
        issuesCreated++;
      }
    }

    console.log(`\nIssues Status: ${issuesCreated} created\n`);

    // Step 6: Verify data in database
    console.log('🔍 Step 6: Verifying data in MongoDB...');

    const finalUserCount = await User.countDocuments();
    const finalIssueCount = await Issue.countDocuments();

    console.log(`✅ Total users in database: ${finalUserCount}`);
    console.log(`✅ Total issues in database: ${finalIssueCount}\n`);

    // Step 7: Display all users
    console.log('📋 Step 7: All users in database:');
    console.log('═════════════════════════════════');
    const allUsers = await User.find().select('-password');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName} (@${user.username})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      if (user.technicianType) console.log(`   Type: ${user.technicianType}`);
      console.log(`   ID: ${user._id}\n`);
    });

    // Step 8: Display all issues
    console.log('\n🚨 Step 8: All issues in database:');
    console.log('═════════════════════════════════');
    const allIssues = await Issue.find()
      .populate('submittedBy', 'username fullName')
      .populate('assignedTechnician', 'username fullName');
    
    allIssues.forEach((issue, index) => {
      console.log(`${index + 1}. Issue #${issue._id}`);
      console.log(`   Location: ${issue.locationCategory}, ${issue.block}, Floor ${issue.floor}`);
      console.log(`   Type: ${issue.issueType}`);
      console.log(`   Status: ${issue.status}`);
      console.log(`   Priority: ${issue.priority}`);
      console.log(`   Submitted by: ${issue.submittedBy.fullName}`);
      console.log(`   Assigned to: ${issue.assignedTechnician ? issue.assignedTechnician.fullName : 'Unassigned'}\n`);
    });

    // Step 9: Summary and next steps
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║              OPERATION SUCCESSFUL!              ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    console.log('✅ Data has been successfully seeded and verified in MongoDB!\n');

    console.log('📝 DEMO ACCOUNT CREDENTIALS:\n');
    console.log('═══ MANAGER ═══');
    console.log('Username: manager_alice');
    console.log('Password: managerpass123\n');

    console.log('═══ TECHNICIAN (Electricity) ═══');
    console.log('Username: tech_elec_charlie');
    console.log('Password: electpass123\n');

    console.log('═══ DATA COLLECTOR ═══');
    console.log('Username: dc_frank');
    console.log('Password: dcpass123\n');

    console.log('💡 NEXT STEPS:');
    console.log('1. Check MongoDB Atlas dashboard to verify data');
    console.log('2. Start your backend: npm run dev');
    console.log('3. Start your frontend: npm start (in frontend folder)');
    console.log('4. Login with any of the demo accounts above\n');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nDebugging Information:');
    console.error('- Check your MONGO_URI in backend/.env');
    console.error('- Ensure your MongoDB cluster is running');
    console.error('- Check network connectivity to MongoDB Atlas');
    console.error('- If using DNS SRV, try MONGO_FALLBACK_URI\n');
    console.error('Full error:', error);
    process.exit(1);
  }
};

// Run the seed and verify script
seedAndVerify();
