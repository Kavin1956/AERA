// Check Diana's actual record in MongoDB Atlas with detailed output
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function checkDianaDeep() {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log(`Connecting to: ${mongoUri?.substring(0, 80) || 'LOCAL'}...\n`);
   
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Find Diana with raw query
    const diana = await User.findOne({ username: 'tech_clean_diana' });
    
    console.log('📋 Diana\'s full record:');
    console.log(JSON.stringify(diana, null, 2));

    console.log('\n🔍 Checking specific fields:');
    console.log(`   _id: ${diana._id}`);
    console.log(`   username: ${diana.username}`);
    console.log(`   role: ${diana.role}`);
    console.log(`   email: ${diana.email}`);
    console.log(`   technicianType: ${diana.technicianType}`);
    console.log(`   technicianType type: ${typeof diana.technicianType}`);
    console.log(`   technicianType === undefined: ${diana.technicianType === undefined}`);
    console.log(`   technicianType == null: ${diana.technicianType == null}`);

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
}

checkDianaDeep();
