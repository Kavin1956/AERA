  const http = require('http');
  const axios = require('axios');

  const base = 'http://localhost:5000/api';

  (async () => {
    try {
      // Login as data collector
      const loginDC = await axios.post(`${base}/auth/login`, { username: 'dc_frank', password: 'dcpass123' });
      const tokenDC = loginDC.data.token;
      console.log('Logged in as DC:', loginDC.data.username);

      // Create issue
      const created = await axios.post(
        `${base}/issues`,
        { title: 'Leaky pipe', description: 'Water leak in room 101', location: 'Building A' },
        { headers: { Authorization: `Bearer ${tokenDC}` } }
      );
      console.log('Created issue:', created.data._id);

      // Login as manager
      const loginMgr = await axios.post(`${base}/auth/login`, { username: 'manager_alice', password: 'managerpass123' });
      const tokenMgr = loginMgr.data.token;
      console.log('Logged in as Manager:', loginMgr.data.username);

      // Assign issue to Water Management technician
      const assigned = await axios.put(
        `${base}/issues/${created.data._id}/assign`,
        { technicianType: 'Water Management' },
        { headers: { Authorization: `Bearer ${tokenMgr}` } }
      );
      console.log('Assigned issue status:', assigned.data.status, 'Assigned to:', assigned.data.assignedTechnician?.username);

      // Login as technician (water)
      const loginTech = await axios.post(`${base}/auth/login`, { username: 'tech_water_bob', password: 'waterpass123' });
      const tokenTech = loginTech.data.token;
      console.log('Logged in as Technician:', loginTech.data.username);

      // Complete issue
      const completed = await axios.put(
        `${base}/issues/${created.data._id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${tokenTech}` } }
      );
      console.log('Completed issue status:', completed.data.status);

      console.log('\n✅ Integration test passed');
    } catch (err) {
      console.error('\n❌ Integration test failed:', err.response?.data || err.message);
    }
  })();
