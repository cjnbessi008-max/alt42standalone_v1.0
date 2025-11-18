const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import database connection (will test connection on startup)
const db = require('./database/connection');

// Import routes
const quizRoutes = require('./routes/quiz');
const focusRoutes = require('./routes/focus');
const userRoutes = require('./routes/user');

// Routes
app.use('/api/quizzes', quizRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'LMS Focus Mode API',
    version: '1.0.0',
    endpoints: {
      quizzes: '/api/quizzes',
      focus: '/api/focus',
      users: '/api/users',
      health: '/api/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}`);
});

module.exports = app;
