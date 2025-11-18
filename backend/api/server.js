/**
 * Impossible Shadow - Backend API Server
 * Integrates with Moodle 3.7 LMS
 * MySQL 5.7, PHP 7.1.9
 */

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

// Import routes
const moodleRoutes = require('./routes/moodle')
const problemsRoutes = require('./routes/problems')
const studentsRoutes = require('./routes/students')

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Impossible Shadow API',
    version: '1.0.0'
  })
})

// API Routes
app.use('/api/moodle', moodleRoutes)
app.use('/api/problems', problemsRoutes)
app.use('/api/students', studentsRoutes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Impossible Shadow API',
    description: 'LMS-integrated division learning app',
    lms: 'Moodle 3.7',
    database: 'MySQL 5.7',
    php: 'PHP 7.1.9',
    endpoints: {
      health: '/health',
      problems: '/api/problems',
      moodle: '/api/moodle',
      students: '/api/students'
    }
  })
})

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      status: 404,
      path: req.path
    }
  })
})

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50))
  console.log('🚀 Impossible Shadow API Server')
  console.log('='.repeat(50))
  console.log(`✓ Server running on port ${PORT}`)
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`✓ Moodle integration: ${process.env.MOODLE_URL || 'Not configured'}`)
  console.log(`✓ Database: MySQL 5.7`)
  console.log('='.repeat(50))
})

module.exports = app
