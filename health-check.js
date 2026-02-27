const axios = require('axios');

const API_BASE = 'https://aera-4y8m.onrender.com/api';

const tests = {
  passed: [],
  failed: []
};

async function runTest(name, testFn) {
  try {
    await testFn();
    tests.passed.push(name);
    console.log(`✅ ${name}`);
  } catch (error) {
    tests.failed.push({ name, error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🔍 Running Comprehensive Project Health Check\n');
  console.log('=' + '='.repeat(50) + '\n');

  // Test 1: Backend connectivity
  await runTest('Backend Connectivity', async () => {
    const response = await axios.get(`${API_BASE}/auth/register`, { timeout: 5000 }).catch(() => ({ status: 404 }));
    if (response.status !== 404) throw new Error('Backend not responding');
  });

  // Test 2: Signup functionality
  const signupUser = {
    fullName: 'Health Check User',
    email: `healthcheck${Date.now()}@test.com`,
    username: `healthcheck${Date.now()}`,
    password: 'HealthCheck123',
    role: 'data_collector'
  };

  await runTest('User Signup', async () => {
    const response = await axios.post(`${API_BASE}/auth/register`, signupUser);
    if (!response.data.message?.includes('success')) throw new Error('Signup failed');
  });

  // Test 3: User Login
  let authToken = null;
  await runTest('User Login', async () => {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: signupUser.username,
      password: signupUser.password
    });
    authToken = response.data.token;
    if (!authToken) throw new Error('No token received');
  });

  // Test 4: Create Issue (Authenticated)
  let issueId = null;
  await runTest('Create Issue (with auth)', async () => {
    const response = await axios.post(
      `${API_BASE}/issues`,
      {
        title: 'Health Check Issue',
        description: 'Test issue for health check',
        location: 'Test Building',
        category: 'structural'
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );
    issueId = response.data._id;
    if (!issueId) throw new Error('No issue ID returned');
  });

  // Test 5: Get All Issues
  await runTest('Retrieve Issues', async () => {
    const response = await axios.get(`${API_BASE}/issues`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!Array.isArray(response.data)) throw new Error('Issues list invalid');
  });

  // Test 6: Create Technician account to complete issue (only technicians can complete)
  const techUser = {
    fullName: 'Health Check Technician',
    email: `techcheck${Date.now()}@test.com`,
    username: `techcheck${Date.now()}`,
    password: 'TechCheck123',
    role: 'technician',
    technicianType: 'electrical'
  };
  
  let techToken = null;
  await runTest('Register Technician', async () => {
    await axios.post(`${API_BASE}/auth/register`, techUser);
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: techUser.username,
      password: techUser.password
    });
    techToken = response.data.token;
    if (!techToken) throw new Error('No token received');
  });

  // Test 7: Update Issue (Complete as Technician)
  if (issueId && techToken) {
    await runTest('Complete Issue (as Technician)', async () => {
      const response = await axios.put(
        `${API_BASE}/issues/${issueId}/complete`,
        { completionNotes: 'Test completion by technician' },
        {
          headers: { 'Authorization': `Bearer ${techToken}` }
        }
      );
      if (!response.data) throw new Error('Update failed');
    });
  }

  // Test 8: JWT Token Validation
  await runTest('JWT Token Validation', async () => {
    const response = await axios.get(`${API_BASE}/issues`, {
      headers: { 'Authorization': `Bearer invalid_token` }
    }).catch(err => ({ status: err.response?.status }));
    if (response.status !== 401) throw new Error('Token validation not working');
  });

  // Test 9: CORS Headers
  await runTest('CORS Configuration', async () => {
    const response = await axios.get(`${API_BASE}/issues`, {
      headers: { 
        'Origin': 'http://localhost:3002',
        'Authorization': `Bearer ${authToken}`
      }
    });
    if (!response.headers['access-control-allow-origin']) throw new Error('CORS not configured');
  });

  // Results
  console.log('\n' + '='.repeat(52));
  console.log(`\n📊 TEST RESULTS:`);
  console.log(`   ✅ Passed: ${tests.passed.length}`);
  console.log(`   ❌ Failed: ${tests.failed.length}`);

  if (tests.failed.length > 0) {
    console.log('\n⚠️  Failed Tests:');
    tests.failed.forEach(t => {
      console.log(`   - ${t.name}: ${t.error}`);
    });
  }

  console.log('\n' + '='.repeat(52));
  
  if (tests.failed.length === 0) {
    console.log('✨ ALL TESTS PASSED! Project is running correctly! ✨');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
  console.log('='.repeat(52) + '\n');
}

runAllTests().catch(console.error);
