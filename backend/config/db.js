const mongoose = require('mongoose');

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const connectDB = async (options = {}) => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = process.env.MONGO_FALLBACK_URI || 'mongodb://localhost:27017/aera_db';
  
  // Try primary URI first, then fallback
  const urisToTry = [];
  if (primaryUri) urisToTry.push(primaryUri);
  if (fallbackUri) urisToTry.push(fallbackUri);
  
  if (urisToTry.length === 0) {
    console.error('❌ No MongoDB URI configured');
    throw new Error('MongoDB URI not configured');
  }

  const maxAttempts = options.maxAttempts || 2; // Reduced from 3 to 2
  const baseDelay = options.baseDelay || 1000; // Reduced from 2000 to 1000

  for (const uri of urisToTry) {
    console.log('📡 Connecting to MongoDB URI:', uri.replace(/:[^:]*@/, ':***@')); // Hide password in logs
    mongoose.set('strictQuery', true);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const connOptions = {
          serverSelectionTimeoutMS: 5000, // Reduced from 10000 to 5000
          socketTimeoutMS: 45000,
          family: 4
        };

        await mongoose.connect(uri, connOptions);
        console.log('✅ MongoDB Connected successfully!');
        return;
      } catch (err) {
        console.warn(`⚠️ MongoDB connect attempt ${attempt}/${maxAttempts} failed: ${err.message}`);

        if (attempt < maxAttempts) {
          const wait = baseDelay * attempt;
          console.log(`⏳ Waiting ${wait / 1000}s before retrying...`);
          await delay(wait);
          continue;
        }
        // This URI failed all attempts, try next one
        break;
      }
    }
  }

  // All URIs failed
  const finalErr = new Error(`Failed to connect to MongoDB with any available URI`);
  throw finalErr;
};

module.exports = connectDB;
