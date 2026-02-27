const axios = require('axios');

const testSignup = async () => {
  try {
    const response = await axios.post(
      'https://aera-4y8m.onrender.com/api/auth/register',
      {
        fullName: 'Test User',
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123',
        role: 'data_collector'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('SUCCESS:', response.data);
  } catch (error) {
    console.log('ERROR Status:', error.response?.status);
    console.log('ERROR Message:', error.response?.data);
    console.log('Full Error:', error.message);
  }
};

testSignup();
