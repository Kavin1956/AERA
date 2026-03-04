// Fix Diana's technicianType on Render backend
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function fixDiana() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aera');
    console.log('✅ Connected to MongoDB\n');

    // 1. Count technicians with undefined technicianType
    const undefinedTechs = await User.find({ 
      role: 'technician', 
      technicianType: { $in: [undefined, null, ''] }
    });

    console.log('📋 Technicians with undefined technicianType:');
    undefinedTechs.forEach(tech => {
      console.log(`   - ${tech.username}: ${tech.technicianType || '(empty)'}`);
    });

    // 2. Fix Diana specifically
    console.log('\n🔧 Fixing Diana...');
    const diana = await User.findOne({ username: 'tech_clean_diana' });
    
    if (diana) {
      console.log(`   Current: ${diana.username}, technicianType="${diana.technicianType}"`);
      diana.technicianType = 'cleaning';
      await diana.save();
      console.log(`   Updated: ${diana.username}, technicianType="${diana.technicianType}"`);
    } else {
      console.log('❌ Diana not found!');
    }

    // 3. Verify fix
    console.log('\n✅ Verification:');
    const updated = await User.findOne({ username: 'tech_clean_diana' });
    console.log(`   Diana's technicianType: "${updated.technicianType}"`);

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
}

fixDiana();
