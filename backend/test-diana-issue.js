// Test script to verify Diana's setup and check for cleaning issues
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Issue = require('./models/issue');

async function testDiana() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aera');
    console.log('✅ Connected to MongoDB');

    // 1. Check Diana's account
    console.log('\n📋 Checking Diana\'s account...');
    const diana = await User.findOne({ username: 'tech_clean_diana' });
    
    if (!diana) {
      console.log('❌ Diana not found in database!');
      return;
    }
    
    console.log(`✅ Found Diana:`);
    console.log(`   ID: ${diana._id}`);
    console.log(`   Username: ${diana.username}`);
    console.log(`   Email: ${diana.email}`);
    console.log(`   Role: ${diana.role}`);
    console.log(`   TechnicianType: ${diana.technicianType}`);
    console.log(`   Password: ${diana.password ? '(set)' : '(not set)'}`);

    // 2. Check for cleaning-type issues
    console.log('\n📋 Checking for cleaning-type issues in database...');
    const cleaningIssues = await Issue.find({ technicianType: { $regex: '^cleaning$', $options: 'i' } });
    console.log(`   Found ${cleaningIssues.length} cleaning-type issues`);
    
    if (cleaningIssues.length > 0) {
      cleaningIssues.forEach((issue, idx) => {
        console.log(`   [${idx}] ID: ${issue._id}`);
        console.log(`       Status: ${issue.status}`);
        console.log(`       TechnicianType: ${issue.technicianType}`);
        console.log(`       AssignedTo: ${issue.assignedTechnician ? 'yes' : 'no'}`);
      });
    }

    // 3. Check for issues directly assigned to Diana
    console.log('\n📋 Checking for issues directly assigned to Diana...');
    const dianaAssigned = await Issue.find({ assignedTechnician: diana._id });
    console.log(`   Found ${dianaAssigned.length} issues assigned to Diana`);
    
    if (dianaAssigned.length > 0) {
      dianaAssigned.forEach((issue, idx) => {
        console.log(`   [${idx}] ID: ${issue._id}`);
        console.log(`       Status: ${issue.status}`);
        console.log(`       TechnicianType: ${issue.technicianType}`);
      });
    }

    // 4. Check for ALL issues in database
    console.log('\n📋 Checking ALL issues in database...');
    const allIssues = await Issue.find();
    console.log(`   Total issues: ${allIssues.length}`);
    
    if (allIssues.length > 0) {
      console.log('\n   Issues breakdown:');
      allIssues.forEach((issue, idx) => {
        console.log(`   [${idx}] techType: "${issue.technicianType}", status: "${issue.status}", assigned: ${issue.assignedTechnician ? 'yes' : 'no'}`);
      });
    }

    // 5. Check what the technician endpoint would return
    console.log('\n📋 Simulating technician endpoint query...');
    const technicianType = diana.technicianType?.toLowerCase();
    console.log(`   Diana's technicianType: "${technicianType}"`);

    const simulatedFilter = {
      $or: [
        { assignedTechnician: diana._id },
        { 
          $and: [
            { technicianType: { $regex: `^${technicianType}$`, $options: 'i' } },
            { status: { $in: ['submitted', 'assigned', 'in_progress', 'completed'] } }
          ]
        }
      ]
    };

    const simulatedTasks = await Issue.find(simulatedFilter);
    console.log(`   Would return: ${simulatedTasks.length} tasks`);
    
    if (simulatedTasks.length > 0) {
      simulatedTasks.forEach((task, idx) => {
        console.log(`   [${idx}] ID: ${task._id}, techType: "${task.technicianType}", status: "${task.status}"`);
      });
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
}

testDiana();
