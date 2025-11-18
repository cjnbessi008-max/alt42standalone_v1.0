/**
 * Authentication Controller
 * Handles user registration, login, and authentication
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

class AuthController {
    /**
     * Register new user
     * POST /api/auth/register
     */
    static async register(req, res) {
        try {
            const { username, email, password, fullName } = req.body;

            // Validate input
            if (!username || !email || !password) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Check if user exists
            const [existing] = await db.query(
                'SELECT id FROM users WHERE username = ? OR email = ?',
                [username, email]
            );

            if (existing.length > 0) {
                return res.status(409).json({ error: 'Username or email already exists' });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create user
            const [result] = await db.query(
                `INSERT INTO users (username, email, password_hash, full_name)
                 VALUES (?, ?, ?, ?)`,
                [username, email, passwordHash, fullName || username]
            );

            const userId = result.insertId;

            // Create user profile
            await db.query(
                `INSERT INTO user_profiles (user_id, current_level, preferred_sequence_type)
                 VALUES (?, 1, 'arithmetic')`,
                [userId]
            );

            // Generate JWT token
            const token = jwt.sign(
                { id: userId, username },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: userId,
                    username,
                    email,
                    fullName: fullName || username
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }

    /**
     * Login user
     * POST /api/auth/login
     */
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            // Validate input
            if (!username || !password) {
                return res.status(400).json({ error: 'Missing username or password' });
            }

            // Find user
            const [users] = await db.query(
                'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
                [username]
            );

            if (users.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = users[0];

            // Check password
            const isValid = await bcrypt.compare(password, user.password_hash);

            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Update last login
            await db.query(
                'UPDATE users SET last_login = NOW() WHERE id = ?',
                [user.id]
            );

            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.full_name
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }

    /**
     * Get current user profile
     * GET /api/auth/me
     */
    static async getCurrentUser(req, res) {
        try {
            const userId = req.user.id;

            const [users] = await db.query(
                `SELECT u.id, u.username, u.email, u.full_name, u.created_at, u.last_login,
                        up.current_level, up.total_problems_solved, up.total_correct,
                        up.best_streak, up.current_streak, up.preferred_sequence_type
                 FROM users u
                 LEFT JOIN user_profiles up ON u.id = up.user_id
                 WHERE u.id = ?`,
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(users[0]);

        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ error: 'Failed to get user data' });
        }
    }

    /**
     * Guest login (demo mode)
     * POST /api/auth/guest
     */
    static async guestLogin(req, res) {
        try {
            const guestUsername = `guest_${Date.now()}`;

            // Create temporary guest user
            const [result] = await db.query(
                `INSERT INTO users (username, email, password_hash, full_name, is_active)
                 VALUES (?, ?, ?, ?, TRUE)`,
                [guestUsername, `${guestUsername}@guest.local`, 'GUEST', 'Guest User']
            );

            const userId = result.insertId;

            // Create profile
            await db.query(
                `INSERT INTO user_profiles (user_id, current_level, preferred_sequence_type)
                 VALUES (?, 1, 'arithmetic')`,
                [userId]
            );

            // Generate token
            const token = jwt.sign(
                { id: userId, username: guestUsername, isGuest: true },
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            );

            res.json({
                message: 'Guest session created',
                token,
                user: {
                    id: userId,
                    username: guestUsername,
                    isGuest: true
                }
            });

        } catch (error) {
            console.error('Guest login error:', error);
            res.status(500).json({ error: 'Guest login failed' });
        }
    }
}

module.exports = AuthController;
