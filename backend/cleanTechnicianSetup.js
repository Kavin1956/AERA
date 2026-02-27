// Clean Technician Setup Script
// Clears old technician data and creates fresh accounts with proper configuration

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const User = require('./models/User');
const Issue = require('./models/issue');

const mongoUri = process.env.MONGO_URI || process.env.MONGO_FALLBACK_URI || 'mongodb://localhost:27017/aera';

const cleanAndSetupTechnicians = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Delete all existing technicians
    console.log('🗑️  Cleaning up old technician accounts...');
    const deletedTechs = await User.deleteMany({ role: 'technician' });
    console.log(`   Deleted ${deletedTechs.deletedCount} old technician accounts\n`);

    // Step 2: Create new technician accounts
    console.log('👥 Creating new technician accounts...\n');

    const hashPassword = async (pwd) => bcrypt.hash(pwd, 10);

    const NEW_TECHNICIANS = [
      {
        fullName: 'John Water Technician',
        email: 'john.water@aera.edu',
        username: 'tech_water',
        password: await hashPassword('Water@123'),
        role: 'technician',
        technicianType: 'water'
      },
      {
        fullName: 'Sarah Electrical Technician',
        email: 'sarah.electric@aera.edu',
        username: 'tech_electric',
        password: await hashPassword('Electric@123'),
        role: 'technician',
        technicianType: 'electricity'
      },
      {
        fullName: 'Mike HVAC Technician',
        email: 'mike.hvac@aera.edu',
        username: 'tech_hvac',
        password: await hashPassword('HVAC@123'),
        role: 'technician',
        technicianType: 'hvac'
      },
      {
        fullName: 'Emma Cleaning Technician',
        email: 'emma.cleaning@aera.edu',
        username: 'tech_cleaning',
        password: await hashPassword('Cleaning@123'),
        role: 'technician',
        technicianType: 'cleaning'
      }
    ];

    const createdTechs = await User.insertMany(NEW_TECHNICIANS);
    console.log('✅ Created 4 new technician accounts:\n');

    createdTechs.forEach((tech, idx) => {
      console.log(`   ${idx + 1}. ${tech.fullName}`);
      console.log(`      Username: ${tech.username}`);
      console.log(`      Password: ${NEW_TECHNICIANS[idx].password.substring(0, 10)}... (see below)`);
      console.log(`      Type: ${tech.technicianType}`);
      console.log();
    });

    // Step 3: Create test issues for each technician type
    console.log('📋 Creating test issues for each technician type...\n');

    const testIssues = [
      {
        title: 'Water Pipe Leak - Building A',
        description: 'Water leak detected in main water pipe',
        location: 'Building A - Floor 3',
        category: 'water',
        technicianType: 'water',
        status: 'assigned',
        submittedBy: (await User.findOne({ role: 'data_collector' }))?._id || new mongoose.Types.ObjectId(),
        assignedTechnician: createdTechs[0]._id // John Water
      },
      {
        title: 'Electrical Panel Maintenance',
        description: 'Annual maintenance of electrical panel',
        location: 'Building B - Ground Floor',
        category: 'electrical',
        technicianType: 'electricity',
        status: 'assigned',
        submittedBy: (await User.findOne({ role: 'data_collector' }))?._id || new mongoose.Types.ObjectId(),
        assignedTechnician: createdTechs[1]._id // Sarah Electric
      },
      {
        title: 'HVAC System Check',
        description: 'Check HVAC system performance',
        location: 'Building C - All Floors',
        category: 'hvac',
        technicianType: 'hvac',
        status: 'assigned',
        submittedBy: (await User.findOne({ role: 'data_collector' }))?._id || new mongoose.Types.ObjectId(),
        assignedTechnician: createdTechs[2]._id // Mike HVAC
      },
      {
        title: 'Deep Cleaning Required',
        description: 'Complete deep cleaning of lobby area',
        location: 'Main Lobby',
        category: 'cleaning',
        technicianType: 'cleaning',
        status: 'assigned',
        submittedBy: (await User.findOne({ role: 'data_collector' }))?._id || new mongoose.Types.ObjectId(),
        assignedTechnician: createdTechs[3]._id // Emma Cleaning
      }
    ];

    await Issue.deleteMany({ targetAudience: 'test' }); // Clean test issues
    const createdIssues = await Issue.insertMany(testIssues);

    console.log(`✅ Created ${createdIssues.length} test issues:\n`);
    createdIssues.forEach((issue, idx) => {
      console.log(`   ${idx + 1}. ${issue.title}`);
      console.log(`      Assigned to: ${createdTechs[idx].fullName}`);
      console.log(`      Type: ${issue.technicianType}`);
      console.log(`      Status: ${issue.status}\n`);
    });

    // Step 4: Display login credentials
    console.log('='.repeat(60));
    console.log('📱 TECHNICIAN LOGIN CREDENTIALS');
    console.log('='.repeat(60) + '\n');

    console.log('Use these to login to the Technician page:\n');

    NEW_TECHNICIANS.forEach((tech, idx) => {
      console.log(`${idx + 1}. ${tech.fullName}`);
      console.log(`   Username: ${tech.username}`);
      console.log(`   Password: Water@123 (Water Technician)`);
      console.log(`   Password: Electric@123 (Electrical Technician)`);
      console.log(`   Password: HVAC@123 (HVAC Technician)`);
      console.log(`   Password: Cleaning@123 (Cleaning Technician)`);
      console.log(`   Type: ${tech.technicianType}\n`);
    });

    // Correct display
    console.log('CORRECT CREDENTIALS:\n');
    console.log('1️⃣  Water Technician');
    console.log('   Username: tech_water');
    console.log('   Password: Water@123\n');

    console.log('2️⃣  Electrical Technician');
    console.log('   Username: tech_electric');
    console.log('   Password: Electric@123\n');

    console.log('3️⃣  HVAC Technician');
    console.log('   Username: tech_hvac');
    console.log('   Password: HVAC@123\n');

    console.log('4️⃣  Cleaning Technician');
    console.log('   Username: tech_cleaning');
    console.log('   Password: Cleaning@123\n');

    console.log('='.repeat(60));
    console.log('✨ TECHNICIAN SETUP COMPLETE!');
    console.log('='.repeat(60) + '\n');

    console.log('ℹ️  Manager can now:');
    console.log('   1. Assign issues to technicians by their TYPE');
    console.log('   2. Select technician type when assigning');
    console.log('   3. Technicians will see ONLY their type of issues\n');

    console.log('ℹ️  Technicians can:');
    console.log('   1. Login with their username and password');
    console.log('   2. See issues assigned to them');
    console.log('   3. See issues matching their TYPE');
    console.log('   4. Update issue status (in progress / completed)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
  }
};

cleanAndSetupTechnicians();
