// Script to send a fix-diana request to the Render backend
const axios = require('axios');
const readlineSync = require('readline-sync');

const API = 'https://aera-4y8m.onrender.com/api';

async function fixDianaViaRender() {
  try {
    console.log('🔧 Attempting to fix Diana on Render Backend\n');

    // 1. First, let's manually make sure the login endpoint works with Diana's correct data
    console.log('📋 Checking Diana\'s current state on Render...\n');
    
    const loginRes = await axios.post(`${API}/auth/login`, {
      username: 'tech_clean_diana',
      password: 'cleanpass123'
    });

    console.log('Diana\'s login response:');
    console.log(`  - Username: ${loginRes.data.username}`);
    console.log(`  - Role: ${loginRes.data.role}`);
    console.log(`  - TechnicianType: ${loginRes.data.technicianType}`);
    
    if (loginRes.data.technicianType === undefined) {
      console.log('\n⚠️  Diana\'s technicianType is undefined!');
      console.log('\n✅ SOLUTION: Need to update Diana\'s record in MongoDB Atlas');
      console.log('\n📝 Manual Fix Instructions:');
      console.log('   1. Go to MongoDB Atlas console');
      console.log('   2. Select Database: aera_db');
      console.log('   3. Collection: users');
      console.log('   4. Find user with username: "tech_clean_diana"');
      console.log('   5. Edit the document and set: technicianType: "cleaning"');
      console.log('   6. Save changes');
      console.log('   7. Test Diana login again');
    } else {
      console.log('\n✅ Diana\'s technicianType is already set correctly!');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

fixDianaViaRender();
