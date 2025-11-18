/**
 * Authentication Middleware
 * JWT-based authentication
 */

import jwt from 'jsonwebtoken';
import { get } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

/**
 * Verify JWT token and attach user to request
 */
export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if session exists and is valid
        const session = get(
            'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")',
            [token]
        );

        if (!session) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Get user data
        const user = get(
            'SELECT id, username, email, full_name, role FROM users WHERE id = ? AND is_active = 1',
            [decoded.userId]
        );

        if (!user) {
            return res.status(401).json({ error: 'User not found or inactive' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({ error: 'Invalid token' });
    }
}

/**
 * Require specific role(s)
 */
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
}

/**
 * Generate JWT token
 */
export function generateToken(userId) {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

/**
 * Optional authentication (doesn't fail if no token)
 */
export function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = get(
            'SELECT id, username, email, full_name, role FROM users WHERE id = ? AND is_active = 1',
            [decoded.userId]
        );

        if (user) {
            req.user = user;
        }
    } catch (error) {
        // Silently fail for optional auth
    }

    next();
}
