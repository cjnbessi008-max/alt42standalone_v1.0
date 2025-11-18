const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Login endpoint (for standalone mode, not LTI)
router.post('/login', async (req, res) => {
    try {
        const { email, ltiUserId } = req.body;

        // Find or create user
        let result = await query(
            'SELECT * FROM users WHERE email = $1 OR lti_user_id = $2',
            [email, ltiUserId]
        );

        let user;
        if (result.rows.length === 0) {
            // Create new user
            result = await query(
                'INSERT INTO users (email, lti_user_id, full_name, role) VALUES ($1, $2, $3, $4) RETURNING *',
                [email, ltiUserId || email, email, 'student']
            );
            user = result.rows[0];
        } else {
            user = result.rows[0];
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Verify token
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');

        // Get updated user info
        const result = await query(
            'SELECT id, email, full_name, role FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: result.rows[0].id,
                email: result.rows[0].email,
                fullName: result.rows[0].full_name,
                role: result.rows[0].role
            }
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }
});

module.exports = router;
