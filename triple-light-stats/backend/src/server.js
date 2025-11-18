const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const statsController = require('./controllers/statsController');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API Routes
app.get('/api/health', statsController.healthCheck.bind(statsController));
app.get('/api/quizzes', statsController.getQuizzes.bind(statsController));
app.get('/api/stats/:quizId', statsController.getQuizStats.bind(statsController));
app.get('/api/stats/:quizId/attempts', statsController.getAttemptStats.bind(statsController));
app.get('/api/stats/:quizId/questions', statsController.getQuestionStats.bind(statsController));

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('Failed to connect to database. Please check your .env configuration.');
      process.exit(1);
    }

    // Start listening
    app.listen(PORT, () => {
      console.log('=====================================');
      console.log('  Triple Light Stats Backend API');
      console.log('=====================================');
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API URL: http://localhost:${PORT}`);
      console.log('');
      console.log('Available endpoints:');
      console.log(`  GET  /api/health`);
      console.log(`  GET  /api/quizzes`);
      console.log(`  GET  /api/stats/:quizId`);
      console.log(`  GET  /api/stats/:quizId/attempts`);
      console.log(`  GET  /api/stats/:quizId/questions`);
      console.log('=====================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
