// Seed script to create demo users in MongoDB
// Usage: node backend/seedUsers.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
// Prefer a configured MONGO_URI. If your network blocks SRV lookups, allow
// passing MONGO_FALLBACK_URI (e.g. standard connection string or local MongoDB).
const mongoUri = process.env.MONGO_URI || process.env.MONGO_FALLBACK_URI || 'mongodb://localhost:27017/aera';

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing users (optional - comment out to preserve)
    // await User.deleteMany({});
    // console.log('🗑️  Cleared existing users');

    // Hash passwords
    const hashPassword = async (pwd) => {
      return await bcrypt.hash(pwd, 10);
    };

    // Demo Users
    const usersToCreate = [
      // 1 Manager
      {
        fullName: 'Alice Manager',
        email: 'manager@aera.edu',
        username: 'manager_alice',
        password: await hashPassword('managerpass123'),
        role: 'manager'
      },

      // 4 Technicians - by type
      {
        fullName: 'Bob Water Manager',
        email: 'tech_water@aera.edu',
        username: 'tech_water_bob',
        password: await hashPassword('waterpass123'),
        role: 'technician',
        technicianType: 'Water Management'
      },
      {
        fullName: 'Charlie Electrician',
        email: 'tech_electric@aera.edu',
        username: 'tech_elec_charlie',
        password: await hashPassword('electpass123'),
        role: 'technician',
        technicianType: 'Electricity'
      },
      {
        fullName: 'Diana Cleaner',
        email: 'tech_clean@aera.edu',
        username: 'tech_clean_diana',
        password: await hashPassword('cleanpass123'),
        role: 'technician',
        technicianType: 'Cleaning'
      },
      {
        fullName: 'Evan General Tech',
        email: 'tech_others@aera.edu',
        username: 'tech_others_evan',
        password: await hashPassword('otherspass123'),
        role: 'technician',
        technicianType: 'Others'
      },

      // 3 Data Collectors
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
      },
      {
        fullName: 'Henry Data Collector',
        email: 'dc_henry@aera.edu',
        username: 'dc_henry',
        password: await hashPassword('dcpass123'),
        role: 'data_collector'
      }
    ];

    // Insert users (upsert by username to avoid duplicates)
    for (const userData of usersToCreate) {
      const existingUser = await User.findOne({ username: userData.username });
      if (existingUser) {
        console.log(`⏭️  User ${userData.username} already exists, skipping...`);
      } else {
        const newUser = await User.create(userData);
        console.log(`✅ Created ${userData.role}: ${userData.fullName} (${userData.username})`);
      }
    }

    console.log('\n📋 Demo Account Credentials:\n');
    console.log('═══ MANAGER ═══');
    console.log('Username: manager_alice');
    console.log('Password: managerpass123');
    console.log('Email: manager@aera.edu\n');

    console.log('═══ TECHNICIANS (by type) ═══');
    console.log('1️⃣  Water Management');
    console.log('   Username: tech_water_bob');
    console.log('   Password: waterpass123');
    console.log('   Email: tech_water@aera.edu\n');

    console.log('2️⃣  Electricity');
    console.log('   Username: tech_elec_charlie');
    console.log('   Password: electpass123');
    console.log('   Email: tech_electric@aera.edu\n');

    console.log('3️⃣  Cleaning');
    console.log('   Username: tech_clean_diana');
    console.log('   Password: cleanpass123');
    console.log('   Email: tech_clean@aera.edu\n');

    console.log('4️⃣  Others');
    console.log('   Username: tech_others_evan');
    console.log('   Password: otherspass123');
    console.log('   Email: tech_others@aera.edu\n');

    console.log('═══ DATA COLLECTORS ═══');
    console.log('1️⃣  Frank');
    console.log('   Username: dc_frank');
    console.log('   Password: dcpass123');
    console.log('   Email: dc_frank@aera.edu\n');

    console.log('2️⃣  Grace');
    console.log('   Username: dc_grace');
    console.log('   Password: dcpass123');
    console.log('   Email: dc_grace@aera.edu\n');

    console.log('3️⃣  Henry');
    console.log('   Username: dc_henry');
    console.log('   Password: dcpass123');
    console.log('   Email: dc_henry@aera.edu\n');

    console.log('✅ Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedUsers();
