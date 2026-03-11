const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Issue = require('./models/issue');

async function checkLocationData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aera');
    console.log('✅ Connected to MongoDB\n');

    const issues = await Issue.find().limit(10);
    console.log('📊 Sample Issues from Database:\n');
    
    issues.forEach((issue, idx) => {
      console.log(`[${idx}] Issue ID: ${issue._id}`);
      console.log(`    Location Object: ${JSON.stringify(issue.location)}`);
      console.log(`    User Type: ${issue.userType}`);
      console.log(`    Status: ${issue.status}`);
      console.log('');
    });

    // Check statistics
    const totalIssues = await Issue.countDocuments();
    const issuesWithLocation = await Issue.countDocuments({ 'location.block': { $exists: true, $ne: '' } });
    const issuesWithoutLocation = await Issue.countDocuments({ 'location.block': { $exists: false } });
    const issuesEmptyLocation = await Issue.countDocuments({ 'location': {} });

    console.log('\n📈 Statistics:');
    console.log(`Total issues: ${totalIssues}`);
    console.log(`Issues with location.block: ${issuesWithLocation}`);
    console.log(`Issues without location field: ${issuesWithoutLocation}`);
    console.log(`Issues with empty location object: ${issuesEmptyLocation}`);

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkLocationData();
