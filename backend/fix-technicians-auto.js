#!/usr/bin/env node

/**
 * Automated Fix Script for Diana's technicianType on MongoDB Atlas
 * This script directly connects to MongoDB Atlas and fixes all technicians with undefined technicianType
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

// Color codes for console output
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

async function fixTechnicians() {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      log.error('MONGO_URI not found in .env file');
      process.exit(1);
    }

    log.progress('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    log.success('Connected to MongoDB Atlas');

    // Define correct technician types
    const TECHNICIAN_MAPPING = {
      'tech_water_bob': 'water',
      'tech_elec_charlie': 'electricity',
      'tech_clean_diana': 'cleaning',
      'tech_others_evan': 'others'
    };

    console.log('\n📋 DIAGNOSIS PHASE');
    console.log('─'.repeat(60));

    // Find all technicians with undefined technicianType
    const undefinedTechs = await User.find({ 
      role: 'technician',
      $or: [
        { technicianType: undefined },
        { technicianType: null },
        { technicianType: '' }
      ]
    });

    if (undefinedTechs.length === 0) {
      log.success('All technicians have correct technicianType! No fixes needed.');
      await mongoose.connection.close();
      process.exit(0);
    }

    log.warn(`Found ${undefinedTechs.length} technician(s) with undefined technicianType:`);
    undefinedTechs.forEach(tech => {
      console.log(`  • ${tech.username} (ID: ${tech._id})`);
    });

    // Find all technicians
    const allTechs = await User.find({ role: 'technician' });
    console.log(`\n📊 Total technicians in database: ${allTechs.length}`);

    console.log('\n🔧 FIX PHASE');
    console.log('─'.repeat(60));

    let fixed = 0;

    // Fix each undefined technician
    for (const tech of undefinedTechs) {
      const correctType = TECHNICIAN_MAPPING[tech.username];
      
      if (correctType) {
        log.progress(`Fixing ${tech.username}...`);
        tech.technicianType = correctType;
        await tech.save();
        log.success(`  Fixed ${tech.username} → technicianType: "${correctType}"`);
        fixed++;
      } else {
        log.warn(`  Skipped ${tech.username} - not in standard mapping`);
      }
    }

    console.log('\n✅ VERIFICATION PHASE');
    console.log('─'.repeat(60));

    // Verify the fixes
    const verifyTechs = await User.find({ role: 'technician' });
    
    console.log(`\n📋 All technicians after fix (${verifyTechs.length} total):\n`);
    
    let allCorrect = true;
    verifyTechs.forEach(tech => {
      const hasType = tech.technicianType && tech.technicianType.trim() !== '';
      const status = hasType ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
      console.log(`  ${status} ${tech.username.padEnd(25)} → technicianType: "${tech.technicianType || '(undefined)'}"`);
      
      if (!hasType) allCorrect = false;
    });

    console.log('\n' + '─'.repeat(60));
    
    if (allCorrect) {
      log.success(`Fixed ${fixed} technician(s)! All technicians now have correct technicianType.`);
    } else {
      log.error('Some technicians still have undefined technicianType.');
    }

    // Test Diana specifically
    console.log('\n🧪 DIANA TEST');
    console.log('─'.repeat(60));
    
    const diana = await User.findOne({ username: 'tech_clean_diana' });
    if (diana && diana.technicianType === 'cleaning') {
      log.success('Diana\'s technicianType is correctly set to "cleaning"');
      console.log(`   Username: ${diana.username}`);
      console.log(`   Email: ${diana.email}`);
      console.log(`   TechnicianType: ${diana.technicianType}`);
    } else if (diana) {
      log.warn(`Diana found but technicianType is: "${diana.technicianType}"`);
    } else {
      log.error('Diana not found in database!');
    }

    console.log('\n' + '─'.repeat(60));
    log.info('Fix process complete! Render backend should now work correctly.');
    console.log('');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    log.error('Connection Error: ' + error.message);
    console.log('\n❌ TROUBLESHOOTING:');
    console.log('1. Verify MONGO_URI is set in .env file');
    console.log('2. Check MongoDB Atlas cluster is running');
    console.log('3. Ensure IP address is whitelisted in MongoDB Atlas');
    console.log('4. Verify network connectivity to cluster');
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the fix
console.log('\n' + '═'.repeat(60));
console.log('🔧 DIANA TECHNICIAN TYPE AUTO-FIX SCRIPT');
console.log('═'.repeat(60) + '\n');

fixTechnicians();
