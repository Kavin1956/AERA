// // // const mongoose = require('mongoose');

// // // const connectDB = async () => {
// // //   const uri = process.env.MONGO_URI;
// // //   if (!uri) {
// // //     console.error('❌ MONGO_URI not set in .env');
// // //     process.exit(1);
// // //   }

// // //   // Primary options - modern and secure
// // //   const primaryOptions = {
// // //     useNewUrlParser: true,
// // //     useUnifiedTopology: true,
// // //     // let mongoose/driver negotiate TLS automatically for Atlas
// // //   };

// // //   try {
// // //     await mongoose.connect(uri, primaryOptions);
// // //     console.log('✅ MongoDB Connected');
// // //     return;
// // //   } catch (err) {
// // //     console.warn('⚠️ Primary MongoDB connection failed:', err.message);
// // //   }

// // //   // Fallback: try allowing invalid TLS certificates (use only for local debug)
// // //   try {
// // //     const fallbackOptions = {
// // //       useNewUrlParser: true,
// // //       useUnifiedTopology: true,
// // //       tls: true,
// // //       tlsAllowInvalidCertificates: true,
// // //       // older driver options that may help in some environments
// // //       sslValidate: false,
// // //       tlsInsecure: true,
// // //       serverSelectionTimeoutMS: 10000
// // //     };
// // //     await mongoose.connect(uri, fallbackOptions);
// // //     console.log('✅ MongoDB Connected (fallback, tlsAllowInvalidCertificates=true)');
// // //     return;
// // //   } catch (err) {
// // //     console.error('❌ MongoDB connection FAILED (fallback):', err.message);
// // //   }

// // //   // Final attempt: log full error and exit
// // //   console.error('❌ All MongoDB connection attempts failed. See above messages.');
// // //   process.exit(1);
// // // };

// // // module.exports = connectDB;


// // //new alter code

// // const mongoose = require('mongoose');

// // const connectDB = async () => {
// //   const uri = process.env.MONGO_URI;
// //   if (!uri) {
// //     console.error('❌ MONGO_URI not set in .env');
// //     process.exit(1);
// //   }

// //   try {
// //     await mongoose.connect(uri, {
// //       useNewUrlParser: true,
// //       useUnifiedTopology: true
// //     });
// //     console.log('✅ MongoDB Connected');
// //   } catch (err) {
// //     console.error('❌ MongoDB connection failed:', err.message);
// //     process.exit(1);
// //   }
// // };

// // module.exports = connectDB;


// //new alter on more code

// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     mongoose.set('strictQuery', true);

//     await mongoose.connect(process.env.MONGO_URI, {
//       serverSelectionTimeoutMS: 15000,
//       socketTimeoutMS: 45000,
//       family: 4 // 👈 VERY IMPORTANT (forces IPv4)
//     });

//     console.log('✅ MongoDB Connected');
//   } catch (error) {
//     console.error('❌ MongoDB connection failed:', error.message);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;

const mongoose = require('mongoose');

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const connectDB = async (options = {}) => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI not set in .env');
    throw new Error('MONGO_URI not configured');
  }

  // make mongoose quieter and predictable
  mongoose.set('strictQuery', true);

  // If an explicit fallback URI is provided, try it first to avoid SRV/DNS issues (useful in restricted networks)
  if (process.env.MONGO_FALLBACK_URI) {
    try {
      await mongoose.connect(process.env.MONGO_FALLBACK_URI, {
        serverSelectionTimeoutMS: 15000,
        family: 4
      });
      console.log('✅ MongoDB Connected via MONGO_FALLBACK_URI (preferred)');
      return;
    } catch (fallbackErr) {
      console.warn('⚠️ Preferred MONGO_FALLBACK_URI failed:', fallbackErr.message);
      console.warn('⚠️ Will attempt primary MONGO_URI (may be +srv) as a fallback');
    }
  }

  const maxAttempts = options.maxAttempts || 5;
  const baseDelay = options.baseDelay || 3000; // 3s

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const connOptions = {
        serverSelectionTimeoutMS: 15000,
        // prefer IPv4 in environments where IPv6 or DNS SRV lookups fail
        family: 4
      };

      await mongoose.connect(uri, connOptions);
      console.log('✅ MongoDB Connected');
      return;
    } catch (err) {
      console.warn(`⚠️ MongoDB connect attempt ${attempt} failed: ${err.message}`);

      // Provide actionable advice for common SRV/DNS problems
      if (err.message && err.message.includes('querySrv')) {
        console.warn('⚠️ DNS SRV lookup failed for your Atlas URI. This often means DNS lookups for _mongodb._tcp are blocked on your network.');
        console.warn('💡 Try one of the following:');
        console.warn('- Ensure your network/DNS allows SRV lookups (try switching to Google DNS 8.8.8.8 or Cloudflare 1.1.1.1)');
        console.warn('- Use a standard (non +srv) connection string from Atlas (contains the shard host addresses)');
        console.warn('- If in a restricted environment, ask your network admin to allow SRV records for your cluster');

        // If the environment provides a non-SRV fallback URI, try it immediately
        if (process.env.MONGO_FALLBACK_URI) {
          console.log('🔁 Detected MONGO_FALLBACK_URI in environment — attempting fallback connection...');
          try {
            await mongoose.connect(process.env.MONGO_FALLBACK_URI, {
              serverSelectionTimeoutMS: 15000,
              family: 4
            });
            console.log('✅ MongoDB Connected via MONGO_FALLBACK_URI');
            return;
          } catch (fallbackErr) {
            console.warn('⚠️ Fallback connection with MONGO_FALLBACK_URI also failed:', fallbackErr.message);
          }
        }
      }

      if (err.message && (err.message.includes('TLS') || err.message.includes('SSL'))) {
        console.warn('⚠️ TLS/SSL issue detected. Ensure your system time is correct and that the server trust chain is intact.');
        console.warn('💡 For local testing only: you can add a fallback connection with relaxed TLS checks (not recommended for production).');
      }

      if (attempt < maxAttempts) {
        const wait = baseDelay * attempt;
        console.log(`⏳ Waiting ${wait / 1000}s before retrying...`);
        await delay(wait);
        continue;
      }

      // After exhausting retries, throw a clear error
      const finalErr = new Error(`Failed to connect to MongoDB after ${maxAttempts} attempts: ${err.message}`);
      finalErr.original = err;
      throw finalErr;
    }
  }
};

module.exports = connectDB;
