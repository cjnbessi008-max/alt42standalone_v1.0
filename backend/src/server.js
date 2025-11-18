/**
 * Alt42 Backend Server
 *
 * Express.js server with Data Shuffle API
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
require('dotenv').config();

const QuestionSetController = require('./api/QuestionSetController');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
dbPool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
    }
    console.log('✅ Database connected at:', res.rows[0].now);
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS
app.use(compression()); // Response compression
app.use(express.json()); // JSON body parser
app.use(express.urlencoded({ extended: true })); // URL-encoded body parser
app.use(morgan('dev')); // HTTP request logger

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Mock authentication middleware (replace with real auth)
const mockAuthMiddleware = (req, res, next) => {
    // TODO: Implement real JWT authentication
    req.user = {
        id: req.headers['x-user-id'] || 'mock-user-id',
        role: req.headers['x-user-role'] || 'student'
    };
    next();
};

// Initialize controllers
const questionSetController = new QuestionSetController(dbPool);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// API Routes
app.get('/api', (req, res) => {
    res.json({
        name: 'Alt42 Data Shuffle API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            questionSets: {
                create: 'POST /api/question-sets',
                addQuestion: 'POST /api/question-sets/:id/questions',
                studentView: 'GET /api/question-sets/:id/student-view',
                submit: 'POST /api/question-sets/:id/submit',
                results: 'GET /api/question-sets/:id/results/:student_id'
            }
        }
    });
});

// Question Set Routes
app.post(
    '/api/question-sets',
    mockAuthMiddleware,
    (req, res) => questionSetController.createQuestionSet(req, res)
);

app.post(
    '/api/question-sets/:id/questions',
    mockAuthMiddleware,
    (req, res) => questionSetController.addQuestion(req, res)
);

app.get(
    '/api/question-sets/:id/student-view',
    mockAuthMiddleware,
    (req, res) => questionSetController.getStudentView(req, res)
);

app.post(
    '/api/question-sets/:id/submit',
    mockAuthMiddleware,
    (req, res) => questionSetController.submitAnswers(req, res)
);

app.get(
    '/api/question-sets/:id/results/:student_id',
    mockAuthMiddleware,
    (req, res) => questionSetController.getResults(req, res)
);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║  Alt42 Data Shuffle API Server             ║
║                                            ║
║  🚀 Server running on port ${PORT}           ║
║  📊 Environment: ${process.env.NODE_ENV || 'development'}              ║
║  🗄️  Database: Connected                   ║
║                                            ║
║  API Docs: http://localhost:${PORT}/api     ║
║  Health: http://localhost:${PORT}/health    ║
╚════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        dbPool.end(() => {
            console.log('Database pool closed');
            process.exit(0);
        });
    });
});

module.exports = app;
