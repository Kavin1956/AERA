// Check all technicians in database
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function checkTechnicians() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aera');
    console.log('✅ Connected to MongoDB\n');

    const techs = await User.find({ role: 'technician' });
    console.log(`📋 Found ${techs.length} technicians:\n`);
    
    techs.forEach((tech, idx) => {
      console.log(`[${idx}] ${tech.username}`);
      console.log(`    ID: ${tech._id}`);
      console.log(`    Email: ${tech.email}`);
      console.log(`    TechnicianType: ${tech.technicianType}`);
      console.log('');
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
}

checkTechnicians();
