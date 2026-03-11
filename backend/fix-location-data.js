const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Issue = require('./models/issue');

const SAMPLE_LOCATIONS = [
  { block: 'AS', floor: 'Ground Floor', roomNumber: '101', category: 'classroom' },
  { block: 'IB', floor: '1st Floor', roomNumber: '202', category: 'lab' },
  { block: 'SUNFLOWER', floor: '2nd Floor', roomNumber: '303', category: 'seminar' },
  { block: 'MECHANICAL', floor: 'Ground Floor', roomNumber: '104', category: 'lab' }
];

async function fixLocationData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aera');
    console.log('✅ Connected to MongoDB\n');

    // Find all issues with empty location
    const issuesToFix = await Issue.find({ 'location.block': { $exists: false } });
    console.log(`📝 Found ${issuesToFix.length} issues with missing location data\n`);

    if (issuesToFix.length === 0) {
      console.log('✅ All issues already have location data!');
      mongoose.connection.close();
      return;
    }

    // Update each issue with sample location data
    for (let i = 0; i < issuesToFix.length; i++) {
      const issue = issuesToFix[i];
      const sampleLocation = SAMPLE_LOCATIONS[i % SAMPLE_LOCATIONS.length];

      issue.location = {
        block: sampleLocation.block,
        floor: sampleLocation.floor,
        roomNumber: sampleLocation.roomNumber,
        category: sampleLocation.category
      };

      await issue.save();
      console.log(`✅ [${i + 1}/${issuesToFix.length}] Updated issue ${issue._id}`);
      console.log(`   Location: Block ${issue.location.block}, Floor ${issue.location.floor}, Room ${issue.location.roomNumber} (${issue.location.category})\n`);
    }

    console.log('✅ All issues updated successfully!');

    // Verify the update
    const updated = await Issue.find();
    console.log('\n📊 Verification - All issues now have:');
    updated.forEach((issue, idx) => {
      console.log(`[${idx}] ${issue.location.block} Block, ${issue.location.floor}, Room ${issue.location.roomNumber}`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixLocationData();
