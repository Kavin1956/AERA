const axios = require('axios');

const API = 'https://aera-4y8m.onrender.com/api';

async function testCompleteFlow() {
  console.log('🔄 COMPLETE TECHNICIAN WORKFLOW TEST\n');
  console.log('=' + '='.repeat(60) + '\n');

  try {
    // Step 1: Get or create a data collector
    console.log('1️⃣  Create Data Collector Account\n');
    const dcData = {
      fullName: 'Test Data Collector',
      email: `dc_${Date.now()}@aera.edu`,
      username: `dc_${Date.now()}`,
      password: 'DC@Test123',
      role: 'data_collector'
    };

    try {
      await axios.post(`${API}/auth/register`, dcData);
      console.log(`✅ Data Collector created: ${dcData.username}\n`);
    } catch (e) {
      console.log(`... (Account may already exist)\n`);
    }

    // Step 2: Login as data collector
    console.log('2️⃣  Data Collector logs in\n');
    const dcLoginRes = await axios.post(`${API}/auth/login`, {
      username: dcData.username,
      password: dcData.password
    });

    const dcToken = dcLoginRes.data.token;
    console.log(`✅ Login successful\n`);

    // Step 3: Create an issue
    console.log('3️⃣  Data Collector submits an issue\n');
    const issueData = {
      userType: 'student',
      locationCategory: 'classroom',
      block: 'A',
      floor: '2',
      roomNumber: '205',
      condition: 'Poor',
      problemLevel: 'High',
      technicianType: 'electricity',
      priority: 'High',
      issueType: 'Electrical',
      risk: 'High',
      analysisNotes: 'Power outlet not working',
      otherSuggestions: 'Complete electrical system check needed'
    };

    const issueCreateRes = await axios.post(`${API}/issues`, issueData, {
      headers: { 'Authorization': `Bearer ${dcToken}` }
    });

    const issueId = issueCreateRes.data._id;
    console.log(`✅ Issue created: ${issueId}`);
    console.log(`   Type: ${issueData.technicianType}`);
    console.log(`   Location: Block ${issueData.block}, Floor ${issueData.floor}, Room ${issueData.roomNumber}\n`);

    // Step 4: Manager assigns issue to technician
    console.log('4️⃣  Manager assigns issue to technician\n');
    const managerToken = (await axios.post(`${API}/auth/login`, {
      username: 'manager_alice',
      password: 'managerpass123'
    })).data.token;

    const assignRes = await axios.put(`${API}/issues/${issueId}/assign`, {
      assignedTechnician: 'tech_electric_sarah',
      technicianType: 'electricity'
    }, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });

    console.log(`✅ Issue assigned to: tech_electric_sarah`);
    console.log(`   Status: ${assignRes.data.status}\n`);

    // Step 5: Technician logs in
    console.log('5️⃣  Technician logs in\n');
    const techToken = (await axios.post(`${API}/auth/login`, {
      username: 'tech_electric_sarah',
      password: 'TechElectric@123'
    })).data.token;

    console.log(`✅ Technician logged in\n`);

    // Step 6: Technician fetches assigned tasks
    console.log('6️⃣  Technician views assigned tasks\n');
    const tasksRes = await axios.get(`${API}/technician/tasks`, {
      headers: { 'Authorization': `Bearer ${techToken}` }
    });

    const tasks = tasksRes.data;
    console.log(`✅ Tasks loaded: ${tasks.length} issue(s)\n`);

    // Find the issue we created
    const foundIssue = tasks.find(t => t._id === issueId);
    if (foundIssue) {
      console.log(`   Found our issue!`);
      console.log(`   Block ${foundIssue.block} • Floor ${foundIssue.floor} • Room ${foundIssue.roomNumber}`);
      console.log(`   Condition: ${foundIssue.condition}`);
      console.log(`   Type: ${foundIssue.technicianType}\n`);
    } else {
      console.log(`⚠️  Issue not found in tasks (may be filtered)\n`);
    }

    // Step 7: Technician updates task status
    console.log('7️⃣  Technician updates task status\n');
    const updateRes = await axios.put(`${API}/technician/tasks/${issueId}`, {
      status: 'in_progress',
      updateNotes: 'Started electrical inspection, power outlet found damaged'
    }, {
      headers: { 'Authorization': `Bearer ${techToken}` }
    });

    console.log(`✅ Task updated`);
    console.log(`   New Status: ${updateRes.data.status}`);
    console.log(`   Progress Notes: ${updateRes.data.updateNotes}\n`);

    // Step 8: Mark as completed
    console.log('8️⃣  Technician marks task as completed\n');
    const completeRes = await axios.put(`${API}/technician/tasks/${issueId}`, {
      status: 'completed',
      updateNotes: 'Electrical outlet repaired, tested and working'
    }, {
      headers: { 'Authorization': `Bearer ${techToken}` }
    });

    console.log(`✅ Task completed`);
    console.log(`   Final Status: ${completeRes.data.status}`);
    console.log(`   Completion Notes: ${completeRes.data.updateNotes}\n`);

    console.log('=' + '='.repeat(60) + '\n');
    console.log('✨ COMPLETE FLOW SUCCESSFUL!\n');

    console.log('📱 TECHNICIAN PAGE LOGIN TEST:\n');
    console.log('Go to: http://localhost:3002');
    console.log('Click: Login');
    console.log('Enter:');
    console.log('  Username: tech_water_john');
    console.log('  Password: TechWater@123');
    console.log('  OR');
    console.log('  Username: tech_electric_sarah');
    console.log('  Password: TechElectric@123\n');

    console.log('The technician dashboard will show:');
    console.log('  • All assigned tasks');
    console.log('  • All issues matching their technician type');
    console.log('  • Ability to update status and add notes\n');

  } catch (error) {
    console.log('❌ ERROR:\n');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Message: ${error.response?.data?.message || error.message}`);
    if (error.response?.data?.details) {
      console.log(`Details: ${error.response.data.details}`);
    }
  }
}

testCompleteFlow();
