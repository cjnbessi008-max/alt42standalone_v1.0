/**
 * Authentication Controller
 * Handles user registration, login, logout
 */

import bcrypt from 'bcryptjs';
import { get, run } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';

/**
 * Register a new user
 */
export async function register(req, res) {
    try {
        const { username, email, password, full_name, role = 'student' } = req.body;

        // Validate input
        if (!username || !email || !password || !full_name) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate role
        if (!['student', 'teacher'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Check if user already exists
        const existingUser = get(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create user
        const result = run(
            `INSERT INTO users (username, email, password_hash, full_name, role)
             VALUES (?, ?, ?, ?, ?)`,
            [username, email, password_hash, full_name, role]
        );

        const userId = result.lastInsertRowid;

        // Initialize visualization state for students
        if (role === 'student') {
            run(
                `INSERT INTO visualization_state (student_id, current_emotion, color_palette)
                 VALUES (?, 'neutral', '{"primary":"#667eea","secondary":"#764ba2","accent":"#f093fb"}')`,
                [userId]
            );
        }

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: userId,
                username,
                email,
                full_name,
                role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
}

/**
 * User login
 */
export async function login(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user
        const user = get(
            'SELECT * FROM users WHERE username = ? AND is_active = 1',
            [username]
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user.id);

        // Calculate expiration (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create session
        run(
            'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
            [user.id, token, expiresAt.toISOString()]
        );

        // Update last login
        run(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
}

/**
 * User logout
 */
export function logout(req, res) {
    try {
        const token = req.token;

        // Delete session
        run('DELETE FROM sessions WHERE token = ?', [token]);

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Server error during logout' });
    }
}

/**
 * Get current user profile
 */
export function getProfile(req, res) {
    try {
        const user = req.user;

        // Get additional stats for students
        if (user.role === 'student') {
            const stats = get(
                `SELECT
                    COUNT(DISTINCT qa.quiz_id) as quizzes_taken,
                    COUNT(qa.id) as total_attempts,
                    AVG(qa.score) as avg_score,
                    SUM(qa.time_spent) as total_time_spent
                 FROM quiz_attempts qa
                 WHERE qa.student_id = ? AND qa.is_completed = 1`,
                [user.id]
            );

            return res.json({
                user,
                stats: stats || {
                    quizzes_taken: 0,
                    total_attempts: 0,
                    avg_score: 0,
                    total_time_spent: 0
                }
            });
        }

        // Get stats for teachers
        if (user.role === 'teacher') {
            const stats = get(
                `SELECT
                    COUNT(id) as total_quizzes,
                    SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) as published_quizzes
                 FROM quizzes
                 WHERE teacher_id = ?`,
                [user.id]
            );

            return res.json({
                user,
                stats: stats || {
                    total_quizzes: 0,
                    published_quizzes: 0
                }
            });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
}

/**
 * Update user profile
 */
export async function updateProfile(req, res) {
    try {
        const userId = req.user.id;
        const { full_name, email, current_password, new_password } = req.body;

        // If changing password, verify current password
        if (new_password) {
            if (!current_password) {
                return res.status(400).json({ error: 'Current password required' });
            }

            const user = get('SELECT password_hash FROM users WHERE id = ?', [userId]);
            const isValidPassword = await bcrypt.compare(current_password, user.password_hash);

            if (!isValidPassword) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            const password_hash = await bcrypt.hash(new_password, 10);
            run('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, userId]);
        }

        // Update other fields
        if (full_name) {
            run('UPDATE users SET full_name = ? WHERE id = ?', [full_name, userId]);
        }

        if (email) {
            // Check if email is already taken
            const existingUser = get(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, userId]
            );

            if (existingUser) {
                return res.status(409).json({ error: 'Email already in use' });
            }

            run('UPDATE users SET email = ? WHERE id = ?', [email, userId]);
        }

        // Get updated user
        const updatedUser = get(
            'SELECT id, username, email, full_name, role FROM users WHERE id = ?',
            [userId]
        );

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error updating profile' });
    }
}
