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

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { fullName, email, username, password, role, technicianType } = req.body;

    if (!fullName || !email || !username || !password || !role) {
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
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ ENFORCE ACCOUNT RESTRICTIONS
    const ALLOWED_ACCOUNTS = {
      manager: ['manager_alice'],
      technician: ['tech_water_bob', 'tech_elec_charlie', 'tech_clean_diana', 'tech_others_evan']
    };

    if (user.role === 'manager' && !ALLOWED_ACCOUNTS.manager.includes(username)) {
      return res.status(403).json({ message: 'Access denied: Invalid manager account' });
    }

    if (user.role === 'technician' && !ALLOWED_ACCOUNTS.technician.includes(username)) {
      return res.status(403).json({ message: 'Access denied: Invalid technician account' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        username: user.username,
        technicianType: user.technicianType,
        fullName: user.fullName
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      role: user.role,
      username: user.username,
      technicianType: user.technicianType
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

    const hashPassword = async (pwd) => {
      return await bcrypt.hash(pwd, 10);
    };

    const usersToCreate = [
      // 1 Manager
      {
        fullName: 'Alice Manager',
        email: 'manager@aera.edu',
        username: 'manager_alice',
        password: await hashPassword('managerpass123'),
        role: 'manager'
      },

      // 4 Technicians
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
        fullName: 'Evan General Technician',
        email: 'tech_others@aera.edu',
        username: 'tech_others_evan',
        password: await hashPassword('otherspass123'),
        role: 'technician',
        technicianType: 'others'
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

    await User.insertMany(usersToCreate);
    console.log('✅ Created all accounts');

    res.json({
      message: 'Accounts seeded successfully',
      accounts: {
        manager: { username: 'manager_alice', password: 'managerpass123' },
        technicians: [
          { username: 'tech_water_bob', password: 'waterpass123', type: 'water' },
          { username: 'tech_elec_charlie', password: 'electpass123', type: 'electricity' },
          { username: 'tech_clean_diana', password: 'cleanpass123', type: 'cleaning' },
          { username: 'tech_others_evan', password: 'otherspass123', type: 'others' }
        ],
        dataCollectors: [
          { username: 'dc_frank', password: 'dcpass123' },
          { username: 'dc_grace', password: 'dcpass123' },
          { username: 'dc_henry', password: 'dcpass123' }
        ]
      }
    });
  } catch (error) {
    console.error('❌ Seed error:', error);
    res.status(500).json({ message: 'Error seeding accounts', error: error.message });
  }
};
