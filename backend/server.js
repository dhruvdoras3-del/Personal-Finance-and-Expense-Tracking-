const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initDB } = require('./config/db');
const apiRoutes = require('./routes/api');
const scheduler = require('./workers/scheduler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend integration
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// API routes mount
app.use('/api', apiRoutes);

// Base health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    isMongo: require('./config/db').getIsMongo()
  });
});

// Serve frontend assets if deployed as a single bundle (future proofing)
// (Can add static folders serving if they compile frontend to dist/)

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err.stack);
  res.status(500).json({ message: 'Internal server error occurred.' });
});

async function startServer() {
  try {
    // 1. Initialize database (MongoDB or local SQLite fallback)
    await initDB();

    // 2. Start background workers for recurring events and alerts
    scheduler.startScheduler();

    // 3. Start server
    app.listen(PORT, () => {
      console.log(`[Server] Finance Server listening on port ${PORT}`);
      console.log(`[Server] Mode: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('[Server Error] Bootstrapping failed:', err);
    process.exit(1);
  }
}

startServer();
