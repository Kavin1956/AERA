// Test the issue assignment for Diana
const axios = require('axios');

const API = process.env.API_URL || 'https://aera-4y8m.onrender.com/api';

async function testAssignment() {
  try {
    console.log('🧪 Testing Diana assignment flow...\n');

    // 1. Manager login
    console.log('1️⃣  Manager login...');
    const managerLogin = await axios.post(`${API}/auth/login`, {
      username: 'manager_alice',
      password: 'managerpass123'
    });
    const managerToken = managerLogin.data.token;
    console.log('✅ Manager logged in\n');

    // 2. Get all issues
    console.log('2️⃣  Getting all issues...');
    const issuesRes = await axios.get(`${API}/issues`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    
    const cleaningIssue = issuesRes.data.find(i => i.technicianType === 'cleaning');
    if (!cleaningIssue) {
      console.log('❌ No cleaning issue found!');
      return;
    }
    
    console.log(`✅ Found cleaning issue: ${cleaningIssue._id}`);
    console.log(`   Current status: ${cleaningIssue.status}`);
    console.log(`   Current technicianType: ${cleaningIssue.technicianType}`);
    console.log(`   Assigned to: ${cleaningIssue.assignedTechnician?.username || 'Unassigned'}\n`);

    // 3. Assign the issue to cleaning technician
    console.log('3️⃣  Assigning issue to cleaning technician...');
    const assignRes = await axios.put(
      `${API}/issues/${cleaningIssue._id}/assign`,
      {
        technicianType: 'cleaning',
        status: 'assigned'
      },
      { headers: { Authorization: `Bearer ${managerToken}` } }
    );

    console.log('✅ Issue assigned!');
    console.log(`   New status: ${assignRes.data.status}`);
    console.log(`   TechnicianType: ${assignRes.data.technicianType}`);
    console.log(`   Assigned to: ${assignRes.data.assignedTechnician?.username || 'Unassigned'}\n`);

    // 4. Diana login
    console.log('4️⃣  Diana login...');
    const dianaLogin = await axios.post(`${API}/auth/login`, {
      username: 'tech_clean_diana',
      password: 'cleanpass123'
    });
    const dianaToken = dianaLogin.data.token;
    console.log('✅ Diana logged in\n');

    // 5. Diana fetches her tasks
    console.log('5️⃣  Diana fetching her tasks...');
    const tasksRes = await axios.get(`${API}/technician/tasks`, {
      headers: { Authorization: `Bearer ${dianaToken}` }
    });

    console.log(`✅ Diana sees ${tasksRes.data.length} task(s):`);
    tasksRes.data.forEach((task, idx) => {
      console.log(`   [${idx}] ID: ${task._id}`);
      console.log(`       Status: ${task.status}`);
      console.log(`       TechnicianType: ${task.technicianType}`);
    });

    if (tasksRes.data.length > 0) {
      console.log('\n✅ SUCCESS! Diana can now see the cleaning issue!');
    } else {
      console.log('\n❌ FAILED! Diana cannot see the issue!');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAssignment();
