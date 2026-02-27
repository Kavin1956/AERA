const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();



// Allow frontend from both local development and production
const FRONTEND_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:3002',
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://10.40.40.183:3002'  // Local network access
];

const LOCALHOST_RE = /^http:\/\/(localhost|10\.40\.40\.183)(?::\d+)?$/;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like Postman, mobile apps, curl)
    if (!origin) return callback(null, true);
    // Allow if origin is in frontend origins list or matches localhost regex
    if (FRONTEND_ORIGINS.includes(origin) || LOCALHOST_RE.test(origin)) return callback(null, true);
    console.warn('⚠️ Blocked CORS request from origin:', origin);
    return callback(null, true); // Allow for now to debug
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

(async function start() {
  try {
    await connectDB();

    app.use(express.json());

    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/issues', require('./routes/issueRoutes'));
    app.use('/api/technician', require('./routes/technicianRoutes'));

    const PORT = Number(process.env.PORT) || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} already in use. Another process may be running.`);
        process.exit(1);
      }
      console.error('Server error:', err);
      process.exit(1);
    });

    const gracefulShutdown = (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
      // Force exit after timeout
      setTimeout(() => {
        console.warn('Forcing shutdown after timeout');
        process.exit(1);
      }, 5000);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    // nodemon sends SIGUSR2 on restart
    process.on('SIGUSR2', () => {
      gracefulShutdown('SIGUSR2');
      // Re-emit SIGUSR2 to allow nodemon to restart the process
      process.kill(process.pid, 'SIGUSR2');
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
