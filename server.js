// Main Server File
// Express server with Moodle integration and Concept Tree API

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./backend/routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 Concept Tree Moodle App Server');
    console.log('='.repeat(50));
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📚 Moodle: ${process.env.MOODLE_URL || 'Not configured'}`);
    console.log(`🗄️  Database: ${process.env.DB_NAME || 'concept_tree_db'}`);
    console.log('='.repeat(50));
});

module.exports = app;
