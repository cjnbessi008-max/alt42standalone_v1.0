/**
 * Sequence Pearls Web App - Main Server
 * Express.js backend with MySQL database
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const problemRoutes = require('./routes/problems');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, HOST, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║        🌟 Sequence Pearls Web App 🌟                    ║
║                                                          ║
║  Server running at: http://${HOST}:${PORT}                ║
║  Environment: ${process.env.NODE_ENV || 'development'}                        ║
║                                                          ║
║  API Endpoints:                                          ║
║  - POST /api/auth/register                               ║
║  - POST /api/auth/login                                  ║
║  - POST /api/auth/guest                                  ║
║  - GET  /api/auth/me                                     ║
║  - GET  /api/problems/recommended                        ║
║  - POST /api/problems/:id/submit                         ║
║  - GET  /api/problems/stats                              ║
║  - GET  /api/problems/achievements                       ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
