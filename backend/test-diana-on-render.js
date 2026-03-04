// Test Diana directly with Render backend (production)
const axios = require('axios');

const API = 'https://aera-4y8m.onrender.com/api';

async function testDianaOnRender() {
  try {
    console.log('🧪 Testing Diana on RENDER BACKEND...\n');

    // 1. Diana login
    console.log('1️⃣  Diana login to Render...');
    const dianaLogin = await axios.post(`${API}/auth/login`, {
      username: 'tech_clean_diana',
      password: 'cleanpass123'
    });
    
    const dianaToken = dianaLogin.data.token;
    console.log('✅ Diana logged in');
    console.log(`   Token: ${dianaToken.substring(0, 20)}...`);
    console.log(`   TechnicianType: ${dianaLogin.data.technicianType}\n`);

    // 2. Diana fetches her tasks
    console.log('2️⃣  Diana fetching her tasks from Render...');
    const tasksRes = await axios.get(`${API}/technician/tasks`, {
      headers: { Authorization: `Bearer ${dianaToken}` }
    });

    console.log(`✅ Diana sees ${tasksRes.data.length} task(s):`);
    
    if (tasksRes.data.length === 0) {
      console.log('   (No tasks assigned)');
    } else {
      tasksRes.data.forEach((task, idx) => {
        console.log(`\n   [${idx}] Issue ID: ${task._id}`);
        console.log(`       Status: ${task.status}`);
        console.log(`       TechnicianType: ${task.technicianType}`);
        console.log(`       Location: Block ${task.block}, Floor ${task.floor}`);
      });
    }

    // 3. Manager login and check what issues exist
    console.log('\n\n3️⃣  Manager checking all issues on Render...');
    const managerLogin = await axios.post(`${API}/auth/login`, {
      username: 'manager_alice',
      password: 'managerpass123'
    });
    const managerToken = managerLogin.data.token;
    console.log('✅ Manager logged in');

    const allIssuesRes = await axios.get(`${API}/issues`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });

    console.log(`\n   Found ${allIssuesRes.data.length} total issue(s):`);
    allIssuesRes.data.forEach((issue, idx) => {
      console.log(`\n   [${idx}] ID: ${issue._id}`);
      console.log(`       TechnicianType: ${issue.technicianType}`);
      console.log(`       Status: ${issue.status}`);
      console.log(`       AssignedTo: ${issue.assignedTechnician?.username || 'Unassigned'}`);
    });

    // 4. Check for cleaning issues specifically
    const cleaningIssues = allIssuesRes.data.filter(i => i.technicianType === 'cleaning');
    console.log(`\n\n🧹 Cleaning issues: ${cleaningIssues.length}`);
    cleaningIssues.forEach((issue) => {
      console.log(`   ID: ${issue._id}`);
      console.log(`   Status: ${issue.status}`);
      console.log(`   Assigned: ${issue.assignedTechnician?.username || 'NO'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      console.error('   → Check username/password');
    }
  }
}

testDianaOnRender();
