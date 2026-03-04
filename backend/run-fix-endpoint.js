#!/usr/bin/env node

/**
 * Automated Fix Script - Calls the fix-technicians endpoint on Render Backend
 * This script activates the new /api/auth/fix-technicians endpoint
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

async function callFixEndpoint() {
  try {
    console.log('\n' + '═'.repeat(70));
    console.log('🔧 AUTOMATED TECHNICIAN TYPE FIX');
    console.log('═'.repeat(70) + '\n');

    log.progress(`Calling fix endpoint on Render: ${RENDER_API}/auth/fix-technicians\n`);

    // Call the fix-technicians endpoint
    const response = await axios.post(`${RENDER_API}/auth/fix-technicians`);

    console.log('📊 FIX RESULTS:');
    console.log('─'.repeat(70));
    
    const { fixed, fixedList, allTechnicians } = response.data;

    if (fixedList && fixedList.length > 0) {
      log.success(`Fixed ${fixed} technician(s):`);
      fixedList.forEach(t => {
        console.log(`  • ${t.username.padEnd(25)} → technicianType: "${t.newTechnicianType}"`);
      });
    } else {
      log.info('No technicians needed fixing (all already have technicianType)');
    }

    console.log('\n📋 ALL TECHNICIANS STATUS:');
    console.log('─'.repeat(70));
    
    if (allTechnicians) {
      allTechnicians.forEach(tech => {
        const status = tech.hasType ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
        console.log(`  ${status} ${tech.username.padEnd(25)} → "${tech.technicianType}"`);
      });
    }

    console.log('\n' + '─'.repeat(70));

    // Verify Diana specifically
    if (allTechnicians) {
      const diana = allTechnicians.find(t => t.username === 'tech_clean_diana');
      if (diana) {
        if (diana.hasType && diana.technicianType === 'cleaning') {
          log.success('Diana\'s technicianType is correctly set!');
        } else {
          log.warn(`Diana's technicianType is: "${diana.technicianType}"`);
        }
      }
    }

    console.log('\n' + '═'.repeat(70));
    log.success('Fix process completed!');
    console.log('═'.repeat(70) + '\n');

  } catch (error) {
    console.log('');
    log.error('Error calling fix endpoint');
    
    if (error.response?.status === 404) {
      log.warn('Fix endpoint not found (404)');
      console.log('\n❌ This means the backend needs to be redeployed with the new endpoint.');
      console.log('\n📝 NEXT STEPS:');
      console.log('1. The backend code has been updated with the fix endpoint');
      console.log('2. Redeploy the backend on Render:');
      console.log('   - Push changes to GitHub');
      console.log('   - Render will auto-redeploy');
      console.log('   - Wait 2-3 minutes for deployment');
      console.log('3. Run this script again\n');
    } else {
      console.log(`   Error: ${error.message}\n`);
      log.warn('Check that Render backend is running');
      console.log('   https://dashboard.render.com\n');
    }
    process.exit(1);
  }
}

callFixEndpoint();
