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
