/**
 * Alt42 Standalone Server
 * Node.js + Express + WebSocket
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activity');
const problemRoutes = require('./routes/problem');
const recommendationRoutes = require('./routes/recommendation');

// Import WebSocket handler
const setupWebSocket = require('./websocket/handler');

// Import database
const db = require('./models/database');

const app = express();
const server = http.createServer(app);

// Environment variables
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // PWA를 위해 비활성화
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Static files (PWA)
app.use(express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../src')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// PWA Manifest
app.get('/manifest.json', (req, res) => {
  res.json({
    name: 'Alt42 Learning Monitor',
    short_name: 'Alt42',
    description: 'Real-time Learning Activity Monitor with Slow Climb Animation',
    start_url: '/',
    display: 'standalone',
    background_color: '#667eea',
    theme_color: '#667eea',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  });
});

// Service Worker
app.get('/sw.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/sw.js'));
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// WebSocket setup
setupWebSocket(server);

// Database connection test
db.testConnection()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
  });

// Start server
server.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   Alt42 Standalone Server                ║
║   Environment: ${process.env.NODE_ENV?.padEnd(28) || 'development'.padEnd(28)}║
║   Server: http://${HOST}:${PORT}${' '.repeat(23 - HOST.length - PORT.toString().length)}║
║   WebSocket: ws://${HOST}:${PORT}${' '.repeat(22 - HOST.length - PORT.toString().length)}║
║   Status: Running ✅                       ║
╚═══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    db.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    db.close();
    process.exit(0);
  });
});

module.exports = server;
