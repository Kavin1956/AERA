const http = require('http');
const axios = require('axios');

const API = 'http://localhost:5000/api';

async function run() {
  try {
    // 1. Login as data collector
    const loginDc = await axios.post(`${API}/auth/login`, { username: 'dc_frank', password: 'dcpass123' });
    const tokenDc = loginDc.data.token;
    console.log('DC logged in, token:', tokenDc?.substring(0,20)+'...');

    // 2. Create issue
    const issuePayload = {
      userType: 'student',
      locationCategory: 'Lecture Hall',
      block: 'A',
      floor: '2',
      roomNumber: '201',
      condition: 'Poor',
      problemLevel: 'Medium',
      otherSuggestions: 'Please check projector',
      data: { projector: 'Not Working' },
      priority: 'High',
      technicianType: 'Electricity',
      status: 'submitted'
    };

    const createRes = await axios.post(`${API}/issues`, issuePayload, { headers: { Authorization: `Bearer ${tokenDc}` } });
    const issueId = createRes.data._id;
    console.log('Issue created:', issueId);

    // 3. Login as manager
    const loginMgr = await axios.post(`${API}/auth/login`, { username: 'manager_alice', password: 'managerpass123' });
    const tokenMgr = loginMgr.data.token;
    console.log('Manager logged in');

    // 4. Assign issue to "Electricity" tech (backend picks a user with that type)
    const assignRes = await axios.put(`${API}/issues/${issueId}/assign`, { technicianType: 'Electricity' }, { headers: { Authorization: `Bearer ${tokenMgr}` } });
    console.log('Assigned issue:', assignRes.data._id, 'AssignedTo:', assignRes.data.assignedTechnician?.username);

    // 5. Login as technician
    const loginTech = await axios.post(`${API}/auth/login`, { username: 'tech_elec_charlie', password: 'electpass123' });
    const tokenTech = loginTech.data.token;
    console.log('Technician logged in');

    // 6. Fetch technician tasks
    const tasksRes = await axios.get(`${API}/technician/tasks`, { headers: { Authorization: `Bearer ${tokenTech}` } });
    console.log('Technician tasks count:', tasksRes.data.length);
    console.log('Tasks:', tasksRes.data.map(t => ({ id: t._id, assignedTo: t.assignedTechnician?.username, techType: t.technicianType, status: t.status })));

    // 7. Update first task to in_progress
    if (tasksRes.data.length > 0) {
      const first = tasksRes.data[0];
      const updateRes = await axios.put(`${API}/technician/tasks/${first._id}`, { status: 'in_progress', updateNotes: 'Started work' }, { headers: { Authorization: `Bearer ${tokenTech}` } });
      console.log('Updated task:', updateRes.data._id, updateRes.data.status, updateRes.data.updateNotes);
    }

  } catch (err) {
    console.error('Flow error:', err.response?.data || err.message);
  }
}

run();
