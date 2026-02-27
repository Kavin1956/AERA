const axios = require('axios');

const testSignupWithCORS = async () => {
  const backendUrl = 'https://aera-4y8m.onrender.com/api';
  
  console.log('🔍 Testing Frontend → Render Backend Connection\n');
  console.log('Frontend URL: http://localhost:3002');
  console.log(`Backend API: ${backendUrl}\n`);
  
  try {
    console.log('📡 Test 1: Basic connectivity to Render...');
    const healthCheck = await axios.get(backendUrl.replace('/api', ''), { timeout: 5000 });
    console.log('✅ Backend is responding\n');
  } catch (err) {
    console.log('⚠️  Backend might be sleeping (cold start). Retrying...\n');
  }

  try {
    console.log('📡 Test 2: Signup API with CORS headers...');
    
    const userData = {
      fullName: 'Frontend Test User',
      email: `frontend${Date.now()}@test.com`,
      username: `frontenduser${Date.now()}`,
      password: 'Password123',
      role: 'data_collector'
    };
    
    const response = await axios.post(
      `${backendUrl}/auth/register`,
      userData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3002'
        },
        timeout: 10000
      }
    );
    
    console.log('✅ SUCCESS!\n');
    console.log('Response:', response.data);
    console.log('\n🎉 Signup API is working correctly!');
    console.log('\n📝 Test Account Created:');
    console.log(`   Username: ${userData.username}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Password: ${userData.password}`);
    
  } catch (error) {
    console.log('❌ ERROR!\n');
    console.log('Status Code:', error.response?.status);
    console.log('Error Message:', error.response?.data?.message);
    console.log('Full Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Cannot reach Render backend');
      console.log('   → Backend might be sleeping (cold start)');
      console.log('   → Try again in a few moments');
    } else if (error.response?.status === 0) {
      console.log('\n⚠️  CORS Error detected');
      console.log('   → Backend CORS settings need adjustment');
    }
  }
};

testSignupWithCORS();
