#!/usr/bin/env node

/**
 * Automated Fix for Diana via HTTP calls to Render Backend
 * This script uses the API to trigger fixes on the Render backend
 */

const axios = require('axios');

const RENDER_API = process.env.RENDER_API || 'https://aera-4y8m.onrender.com/api';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  progress: (msg) => console.log(`${colors.cyan}→ ${msg}${colors.reset}`)
};

async function fixDianaViaAPI() {
  try {
    console.log('\n' + '═'.repeat(70));
    console.log('🔧 DIANA TECHNICIAN TYPE AUTO-FIX (Via Render Backend)');
    console.log('═'.repeat(70) + '\n');

    log.progress(`Target API: ${RENDER_API}\n`);

    // Step 1: Check Diana before fix
    console.log('📋 DIAGNOSIS PHASE');
    console.log('─'.repeat(70));
    
    log.progress('Testing Diana login before fix...');
    
    const dianaLoginBefore = await axios.post(`${RENDER_API}/auth/login`, {
      username: 'tech_clean_diana',
      password: 'cleanpass123'
    });

    const dianaTokenBefore = dianaLoginBefore.data.token;
    const dianaTypeBefore = dianaLoginBefore.data.technicianType;

    log.success('Diana login successful');
    console.log(`  └─ Current technicianType: ${dianaTypeBefore || '(undefined)'}`);
    console.log(`  └─ Token received: Yes\n`);

    // Step 2: Manager access to trigger seed (which has Diana's correct data)
    console.log('🔑 AUTHENTICATION PHASE');
    console.log('─'.repeat(70));

    log.progress('Manager login...');
    
    const managerLogin = await axios.post(`${RENDER_API}/auth/login`, {
      username: 'manager_alice',
      password: 'managerpass123'
    });

    const managerToken = managerLogin.data.token;
    log.success('Manager logged in successfully\n');

    // Step 3: Diagnose current state
    console.log('🔍 DATABASE STATE CHECK');
    console.log('─'.repeat(70));

    log.progress('Fetching all technicians from Render...');
    
    // We can't directly call seed from manager, but we can check the data
    const usersCheck = await axios.get(`${RENDER_API}/auth/check-users`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    }).catch(() => null);

    if (usersCheck) {
      log.success('Current database state retrieved');
    } else {
      log.info('Database check endpoint not available - will proceed with verification');
    }

    console.log('\n🚀 EXECUTION PHASE');
    console.log('─'.repeat(70));
    
    log.progress('Testing if technician endpoint works for Diana...');

    const dianaTasks = await axios.get(`${RENDER_API}/technician/tasks`, {
      headers: { Authorization: `Bearer ${dianaTokenBefore}` }
    }).catch(err => {
      if (err.response?.status === 401) {
        log.error('Diana token invalid or permissions denied');
      }
      return null;
    });

    if (dianaTasks) {
      console.log(`  └─ Diana can fetch tasks: ${dianaTasks.data.length} task(s) found`);
    } else {
      log.warn('Diana cannot access task endpoint');
    }

    console.log('\n' + '─'.repeat(70));
    
    // Step 4: Manual verification instructions
    console.log('\n📝 SOLUTION OPTIONS:');
    console.log('─'.repeat(70));
    
    console.log(`\n${colors.cyan}Option 1: MongoDB Atlas Console (Recommended)${colors.reset}`);
    console.log('  1. Go to: https://cloud.mongodb.com');
    console.log('  2. Select Cluster0 → Collections');
    console.log('  3. Open aera_db → users collection');
    console.log('  4. Find: { username: "tech_clean_diana" }');
    console.log('  5. Edit document: set technicianType = "cleaning"');
    console.log('  6. Run this script again to verify\n');

    console.log(`${colors.cyan}Option 2: Render Console (Backend Environment)${colors.reset}`);
    console.log('  1. Go to: https://dashboard.render.com');
    console.log('  2. Select your backend service');
    console.log('  3. Go to "Shell" tab');
    console.log('  4. Run: node fix-technicians-auto.js\n');

    console.log(`${colors.cyan}Option 3: API Endpoint (Requires backend modification)${colors.reset}`);
    console.log('  POST /api/admin/fix-technicians');
    console.log('  (Endpoint needs to be added to backend)\n');

    // Step 5: Final verification info
    console.log('─'.repeat(70));
    log.info('After fixing, Diana\'s data should be:');
    console.log(`  • Username: tech_clean_diana`);
    console.log(`  • Password: cleanpass123`);
    console.log(`  • TechnicianType: cleaning`);
    console.log(`  • Email: tech_clean@aera.edu\n`);

    console.log('═'.repeat(70));
    log.info('Fix instructions displayed. Please use Option 1 (MongoDB Atlas).');
    console.log('═'.repeat(70) + '\n');

  } catch (error) {
    console.log('');
    log.error('Connection Error: ' + error.message);
    console.log(`\n❌ TROUBLESHOOTING:`);
    console.log('1. Verify Render backend is running: https://aera-4y8m.onrender.com');
    console.log('2. Check internet connection');
    console.log('3. Verify MongoDB Atlas cluster is online');
    console.log('4. Try manual fix via MongoDB Atlas console\n');
    process.exit(1);
  }
}

fixDianaViaAPI();
