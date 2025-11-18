/**
 * API Gateway Server
 * Main entry point for the Node.js Express API Gateway
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const config = require('./config/config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Import routes
const problemRoutes = require('./routes/problemRoutes');
const attemptRoutes = require('./routes/attemptRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const authRoutes = require('./routes/authRoutes');

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO for real-time features
const io = new Server(server, {
  cors: {
    origin: config.corsOrigins,
    methods: ['GET', 'POST']
  }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(helmet()); // Security headers
app.use(cors({ origin: config.corsOrigins, credentials: true })); // CORS
app.use(compression()); // Response compression
app.use(express.json({ limit: '10mb' })); // JSON body parser
app.use(express.urlencoded({ extended: true })); // URL-encoded body parser
app.use(morgan('combined', { stream: logger.stream })); // HTTP logging

// Apply rate limiting
app.use('/api/', rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'API Gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/problems', problemRoutes);
app.use('/api/v1/attempts', attemptRoutes);
app.use('/api/v1/modules', moduleRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'AI Education API Gateway',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      docs: '/api/docs'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Socket.IO event handlers
io.on('connection', (socket) => {
  logger.info(`Socket client connected: ${socket.id}`);

  socket.on('join_problem', (problemId) => {
    socket.join(`problem_${problemId}`);
    logger.info(`Socket ${socket.id} joined problem ${problemId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = config.port || 3001;

server.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(`Environment: ${config.environment}`);
  logger.info(`CORS origins: ${config.corsOrigins.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = app; // For testing
