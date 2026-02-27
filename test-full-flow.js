const axios = require('axios');

const testFullFlow = async () => {
  const baseURL = 'https://aera-4y8m.onrender.com/api';
  
  console.log('🚀 Testing Complete Authentication Flow\n');
  console.log('================================================');
  
  const testUser = {
    fullName: 'Integration Test User',
    email: `testflow${Date.now()}@aera.edu`,
    username: `testflow${Date.now()}`,
    password: 'TestFlow123'
  };
  
  try {
    // Step 1: Signup
    console.log('\n📝 STEP 1: Signup');
    console.log(`Creating user: ${testUser.username}`);
    
    const signupResponse = await axios.post(`${baseURL}/auth/register`, {
      ...testUser,
      role: 'data_collector'
    });
    
    console.log('✅ Signup Successful!');
    console.log('Response:', signupResponse.data);
    
    // Step 2: Login
    console.log('\n🔐 STEP 2: Login');
    console.log(`Logging in as: ${testUser.username}`);
    
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      username: testUser.username,
      password: testUser.password
    });
    
    console.log('✅ Login Successful!');
    console.log('Token:', loginResponse.data.token.substring(0, 20) + '...');
    console.log('Role:', loginResponse.data.role);
    console.log('Username:', loginResponse.data.username);
    
    // Step 3: Use token for authenticated request
    console.log('\n🛡️  STEP 3: Test Authenticated Request');
    console.log('Testing issue creation with token...');
    
    const issueResponse = await axios.post(
      `${baseURL}/issues`,
      {
        title: 'Test Issue',
        description: 'This is a test issue',
        location: 'Building A',
        category: 'structural'
      },
      {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`
        }
      }
    );
    
    console.log('✅ Issue Created Successfully!');
    console.log('Issue ID:', issueResponse.data._id);
    
    console.log('\n' + '='.repeat(48));
    console.log('✨ ALL TESTS PASSED! System is working correctly!');
    console.log('='.repeat(48));
    
  } catch (error) {
    console.log('\n' + '❌ ERROR'.padEnd(48, '='));
    console.log('Step:', error.config?.url);
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message || error.message);
    
    if (error.response?.data) {
      console.log('\nFull Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
};

testFullFlow();
