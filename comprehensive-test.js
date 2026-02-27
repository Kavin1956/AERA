const axios = require('axios');

const testSignupFromFrontend = async () => {
  const backendUrl = 'https://aera-4y8m.onrender.com/api';
  
  try {
    console.log('🧪 Testing signup API...\n');
    
    const signupData = {
      fullName: 'John Doe',
      email: `user${Date.now()}@test.com`,
      username: `testuser${Date.now()}`,
      password: 'Test123456',
      role: 'data_collector'
    };
    
    console.log('📤 Sending:', JSON.stringify(signupData, null, 2));
    console.log(`\n🌐 To: ${backendUrl}/auth/register\n`);
    
    const response = await axios.post(
      `${backendUrl}/auth/register`,
      signupData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3002'  // Simulate browser request
        }
      }
    );
    
    console.log('✅ SUCCESS!');
    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    console.log('\n✨ Signup is working correctly!');
    return true;
  } catch (error) {
    console.error('❌ ERROR!');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Full Error:', error.message);
    return false;
  }
};

testSignupFromFrontend().then(success => {
  if (!success) {
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check if Render backend is accessible');
    console.log('2. Verify CORS settings on backend');
    console.log('3. Check MongoDB connection on Render');
  }
});
