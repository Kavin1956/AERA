const axios = require('axios');

const API = 'https://aera-4y8m.onrender.com/api';

const CLEAN_TECHNICIAN_DATA = {
  technicians: [
    {
      fullName: 'John Water Technician',
      email: `john.water.${Date.now()}@aera.edu`,
      username: 'tech_water_john',
      password: 'TechWater@123',
      role: 'technician',
      technicianType: 'water'
    },
    {
      fullName: 'Sarah Electrical Technician',
      email: `sarah.electric.${Date.now()}@aera.edu`,
      username: 'tech_electric_sarah',
      password: 'TechElectric@123',
      role: 'technician',
      technicianType: 'electricity'
    },
    {
      fullName: 'Mike HVAC Technician',
      email: `mike.hvac.${Date.now()}@aera.edu`,
      username: 'tech_hvac_mike',
      password: 'TechHVAC@123',
      role: 'technician',
      technicianType: 'hvac'
    },
    {
      fullName: 'Emma Cleaning Technician',
      email: `emma.cleaning.${Date.now()}@aera.edu`,
      username: 'tech_cleaning_emma',
      password: 'TechCleaning@123',
      role: 'technician',
      technicianType: 'cleaning'
    }
  ]
};

async function setupTechnicians() {
  console.log('🚀 CLEAN TECHNICIAN SETUP\n');
  console.log('=' + '='.repeat(55) + '\n');

  const createdTechs = [];

  // Step 1: Create new technician accounts
  console.log('📝 Creating 4 new technician accounts...\n');

  for (const techData of CLEAN_TECHNICIAN_DATA.technicians) {
    try {
      const response = await axios.post(`${API}/auth/register`, techData);
      createdTechs.push(techData);
      console.log(`✅ Created: ${techData.fullName}`);
      console.log(`   Username: ${techData.username}`);
      console.log(`   Type: ${techData.technicianType}\n`);
    } catch (error) {
      console.log(`❌ Error creating ${techData.fullName}:`);
      console.log(`   ${error.response?.data?.message || error.message}\n`);
    }
  }

  // Step 2: Test login for each technician
  console.log('=' + '='.repeat(55) + '\n');
  console.log('🔐 Testing technician logins...\n');

  const loginTokens = {};

  for (const tech of createdTechs) {
    try {
      const loginResponse = await axios.post(`${API}/auth/login`, {
        username: tech.username,
        password: tech.password
      });

      loginTokens[tech.username] = loginResponse.data.token;
      console.log(`✅ ${tech.username} - Login successful`);
      console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...`);
      console.log(`   Role: ${loginResponse.data.role}`);
      console.log(`   Username: ${loginResponse.data.username}\n`);
    } catch (error) {
      console.log(`❌ ${tech.username} - Login failed`);
      console.log(`   ${error.response?.data?.message || error.message}\n`);
    }
  }

  // Step 3: Test technician tasks endpoint
  console.log('=' + '='.repeat(55) + '\n');
  console.log('📋 Testing technician tasks endpoint...\n');

  for (const tech of createdTechs) {
    const token = loginTokens[tech.username];
    if (!token) continue;

    try {
      const tasksResponse = await axios.get(`${API}/technician/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log(`✅ ${tech.username} - Tasks endpoint working`);
      console.log(`   Tasks found: ${tasksResponse.data.length}`);
      if (tasksResponse.data.length > 0) {
        console.log(`   First task: ${tasksResponse.data[0].title}`);
      }
      console.log();
    } catch (error) {
      console.log(`❌ ${tech.username} - Tasks endpoint error`);
      console.log(`   ${error.response?.data?.message || error.message}\n`);
    }
  }

  // Step 4: Display credentials
  console.log('=' + '='.repeat(55) + '\n');
  console.log('📱 TECHNICIAN LOGIN CREDENTIALS\n');
  console.log('Use these to login to the Technician page:\n');

  createdTechs.forEach((tech, idx) => {
    console.log(`${idx + 1}️⃣  ${tech.fullName}`);
    console.log(`   Username: ${tech.username}`);
    console.log(`   Password: ${tech.password}`);
    console.log(`   Type: ${tech.technicianType}\n`);
  });

  console.log('=' + '='.repeat(55) + '\n');
  console.log('ℹ️  HOW IT WORKS:\n');
  console.log('Manager assigns issues:');
  console.log('  1. Manager creates issue through Manager Dashboard');
  console.log('  2. Manager selects TECHNICIAN TYPE (water, electricity, hvac, cleaning)');
  console.log('  3. Issue is assigned to matching technician\n');

  console.log('Technician sees issues:');
  console.log('  1. Login with their username and password');
  console.log('  2. See all issues of their TYPE (assigned to them)');
  console.log('  3. Open and update task status');
  console.log('  4. Add completion notes when done\n');

  console.log('=' + '='.repeat(55) + '\n');
  console.log('✨ SETUP COMPLETE!\n');
}

setupTechnicians().catch(console.error);
