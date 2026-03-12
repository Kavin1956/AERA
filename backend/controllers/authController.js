// const User = require('../models/User');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// exports.register = async (req, res) => {
//   try {
//     const { fullName, email, username, password, role, technicianType } = req.body;

//     // Validate required fields
//     if (!fullName || !email || !username || !password || !role) {
//       return res.status(400).json({ message: 'Please fill in all required fields' });
//     }

//     // Check if manager email matches
//     if (role === 'manager' && email !== process.env.MANAGER_EMAIL) {
//       return res.status(403).json({ message: 'Unauthorized manager email' });
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({ $or: [{ username }, { email }] });
//     if (existingUser) {
//       return res.status(409).json({ message: 'Username or email already exists' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       fullName,
//       email,
//       username,
//       password: hashedPassword,
//       role,
//       technicianType
//     });

//     res.status(201).json({ message: 'User registered successfully', userId: user._id });
//   } catch (error) {
//     console.error('Register error:', error);
//     res.status(500).json({ message: 'Server error during registration' });
//   }
// };

// exports.login = async (req, res) => {
//   try {
//     const { username, password, role } = req.body;

//     if (!username || !password || !role) {
//       return res.status(400).json({ message: 'Please provide username, password, and role' });
//     }

//     const user = await User.findOne({ username, role });
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

//     const token = jwt.sign(
//       { id: user._id, role: user.role, technicianType: user.technicianType, username: user.username, fullName: user.fullName },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     res.json({ token, role: user.role, username: user.username, technicianType: user.technicianType });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ message: 'Server error during login' });
//   }
// };

//new code alter 

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const hashPassword = (pwd) => bcrypt.hash(pwd, 10);

const buildDefaultUsers = async () => ([
  {
    fullName: 'Alice Manager',
    email: 'manager@aera.edu',
    username: 'manager_alice',
    password: await hashPassword('managerpass123'),
    role: 'manager'
  },
  {
    fullName: 'Bob Electrical Technician',
    email: 'tech_electrical@aera.edu',
    username: 'tech_electrical_bob',
    password: await hashPassword('electricalpass123'),
    role: 'technician',
    technicianType: 'electrical'
  },
  {
    fullName: 'Charlie IT Technician',
    email: 'tech_it@aera.edu',
    username: 'tech_it_charlie',
    password: await hashPassword('itpass123'),
    role: 'technician',
    technicianType: 'it_system'
  },
  {
    fullName: 'Diana Maintenance Technician',
    email: 'tech_maintenance@aera.edu',
    username: 'tech_maintenance_diana',
    password: await hashPassword('maintenancepass123'),
    role: 'technician',
    technicianType: 'maintenance'
  },
  {
    fullName: 'Evan Safety Technician',
    email: 'tech_safety@aera.edu',
    username: 'tech_safety_evan',
    password: await hashPassword('safetypass123'),
    role: 'technician',
    technicianType: 'safety'
  },
  {
    fullName: 'Frank General Support Technician',
    email: 'tech_support@aera.edu',
    username: 'tech_support_frank',
    password: await hashPassword('supportpass123'),
    role: 'technician',
    technicianType: 'general_support'
  },
  {
    fullName: 'Grace Data Collector',
    email: 'dc_grace@aera.edu',
    username: 'dc_grace',
    password: await hashPassword('dcpass123'),
    role: 'data_collector',
    userType: 'data_collector'
  },
  {
    fullName: 'Hannah Data Collector',
    email: 'dc_hannah@aera.edu',
    username: 'dc_hannah',
    password: await hashPassword('dcpass123'),
    role: 'data_collector',
    userType: 'student'
  },
  {
    fullName: 'Isaac Data Collector',
    email: 'dc_isaac@aera.edu',
    username: 'dc_isaac',
    password: await hashPassword('dcpass123'),
    role: 'data_collector',
    userType: 'faculty'
  },
  {
    fullName: 'Demo User',
    email: 'demo@aera.edu',
    username: 'demo',
    password: await hashPassword('demo123'),
    role: 'data_collector',
    userType: 'student'
  }
]);

exports.ensureDefaultAccounts = async () => {
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) {
    return;
  }

  const usersToCreate = await buildDefaultUsers();
  await User.insertMany(usersToCreate);
  console.log('Seeded default accounts for local development.');
};

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { fullName, email, username, password, role, userType, technicianType } = req.body;

    if (!fullName || !email || !username || !password || !role || !userType) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    // Allow only ONE manager email
    if (role === 'manager' && email !== process.env.MANAGER_EMAIL) {
      return res.status(403).json({ message: 'Unauthorized manager email' });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      fullName,
      email,
      username,
      password: hashedPassword,
      role,
      userType,
      technicianType
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 🔑 DO NOT REQUIRE ROLE FROM FRONTEND
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // 🔑 FIND USER ONLY BY USERNAME
    const user = await User.findOne({ username });
    console.log(`[LOGIN] Username: ${username}`);
    console.log(`[LOGIN] User found:`, user ? `${user.username} (${user.role})` : 'NOT FOUND');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ ENFORCE ACCOUNT RESTRICTIONS
    const ALLOWED_ACCOUNTS = {
      manager: ['manager_alice'],
      technician: ['tech_electrical_bob', 'tech_it_charlie', 'tech_maintenance_diana', 'tech_safety_evan', 'tech_support_frank']
    };

    if (user.role === 'manager' && !ALLOWED_ACCOUNTS.manager.includes(username)) {
      return res.status(403).json({ message: 'Access denied: Invalid manager account' });
    }

    if (user.role === 'technician' && !ALLOWED_ACCOUNTS.technician.includes(username)) {
      return res.status(403).json({ message: 'Access denied: Invalid technician account' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`[LOGIN] Password check for ${username}: ${isMatch ? 'MATCH' : 'MISMATCH'}`);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        username: user.username,
        userType: user.userType,
        technicianType: user.technicianType,
        fullName: user.fullName,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      role: user.role,
      username: user.username,
      userType: user.userType,
      technicianType: user.technicianType,
      fullName: user.fullName,
      email: user.email
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ================= SEED ACCOUNTS =================
exports.seedAccounts = async (req, res) => {
  try {
    console.log('\n🌱 Seeding accounts...');

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    const usersToCreate = await buildDefaultUsers();

    await User.insertMany(usersToCreate);
    console.log('✅ Created all accounts');

    res.json({
      message: 'Accounts seeded successfully',
      accounts: {
        manager: { username: 'manager_alice', password: 'managerpass123' },
        technicians: [
          { username: 'tech_electrical_bob', password: 'electricalpass123', type: 'electrical', handles: 'Power, lights, fans, junction box' },
          { username: 'tech_it_charlie', password: 'itpass123', type: 'it_system', handles: 'PC, projector, internet' },
          { username: 'tech_maintenance_diana', password: 'maintenancepass123', type: 'maintenance', handles: 'Furniture, whiteboard' },
          { username: 'tech_safety_evan', password: 'safetypass123', type: 'safety', handles: 'Fire safety, emergency exit' },
          { username: 'tech_support_frank', password: 'supportpass123', type: 'general_support', handles: 'Other / additional issues' }
        ],
        dataCollectors: [
          { username: 'dc_grace', password: 'dcpass123' },
          { username: 'dc_hannah', password: 'dcpass123' },
          { username: 'dc_isaac', password: 'dcpass123' },
          { username: 'demo', password: 'demo123' }
        ]
      }
    });
  } catch (error) {
    console.error('❌ Seed error:', error);
    res.status(500).json({ message: 'Error seeding accounts', error: error.message });
  }
};

// ================= FIX TECHNICIAN TYPES =================
exports.fixTechnicians = async (req, res) => {
  try {
    console.log('\n🔧 fixTechnicians endpoint called');

    // Define correct technician types
    const TECHNICIAN_MAPPING = {
      'tech_electrical_bob': 'electrical',
      'tech_it_charlie': 'it_system',
      'tech_maintenance_diana': 'maintenance',
      'tech_safety_evan': 'safety',
      'tech_support_frank': 'general_support'
    };

    // Find technicians with undefined technicianType
    const undefinedTechs = await User.find({ 
      role: 'technician',
      $or: [
        { technicianType: undefined },
        { technicianType: null },
        { technicianType: '' }
      ]
    });

    console.log(`   Found ${undefinedTechs.length} technician(s) to fix`);

    let fixed = [];
    let skipped = [];

    // Fix each technician
    for (const tech of undefinedTechs) {
      const correctType = TECHNICIAN_MAPPING[tech.username];
      
      if (correctType) {
        console.log(`   Fixing ${tech.username} → "${correctType}"`);
        tech.technicianType = correctType;
        await tech.save();
        fixed.push({
          username: tech.username,
          newTechnicianType: correctType
        });
      } else {
        console.log(`   Skipping ${tech.username} - not in standard mapping`);
        skipped.push(tech.username);
      }
    }

    // Verify all technicians now have type
    const allTechs = await User.find({ role: 'technician' });
    const verification = allTechs.map(tech => ({
      username: tech.username,
      technicianType: tech.technicianType || '(undefined)',
      hasType: !!(tech.technicianType && tech.technicianType.trim())
    }));

    console.log(`   ✅ Fix complete: ${fixed.length} fixed, ${skipped.length} skipped`);

    res.json({
      message: 'Technician fix completed',
      fixed: fixed.length,
      skipped: skipped.length,
      fixedList: fixed,
      skippedList: skipped,
      allTechnicians: verification
    });
  } catch (error) {
    console.error('❌ fixTechnicians error:', error);
    res.status(500).json({ message: 'Error fixing technicians', error: error.message });
  }
};
