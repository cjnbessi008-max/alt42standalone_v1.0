const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Health check endpoint
router.get('/', async (req, res) => {
    try {
        // Check database connection
        await pool.query('SELECT 1');

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'Mental Stamina API',
            database: 'connected'
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            service: 'Mental Stamina API',
            database: 'disconnected',
            error: error.message
        });
    }
});

module.exports = router;
