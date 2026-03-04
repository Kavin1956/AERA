// Check current state of cleaning issue and all issues
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Issue = require('./models/issue');
const User = require('./models/User');

async function checkIssueState() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aera');
    console.log('✅ Connected to MongoDB\n');

    // Check all issues with population
    const issues = await Issue.find()
      .populate('assignedTechnician', 'username email technicianType')
      .populate('submittedBy', 'username');
    
    console.log(`📋 All issues in database (${issues.length}):\n`);
    
    issues.forEach((issue, idx) => {
      console.log(`[${idx}] ID: ${issue._id}`);
      console.log(`    TechnicianType: ${issue.technicianType}`);
      console.log(`    Status: ${issue.status}`);
      console.log(`    AssignedTechnician: ${issue.assignedTechnician ? issue.assignedTechnician.username : 'None'}`);
      console.log('');
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
}

checkIssueState();
