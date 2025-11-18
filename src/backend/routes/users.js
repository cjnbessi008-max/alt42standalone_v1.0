const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Get current user profile
 * GET /api/users/me
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT id, username, email, name, role, level, created_at, last_login
      FROM users
      WHERE id = ?
    `, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user statistics
    const [stats] = await db.query(`
      SELECT
        COUNT(DISTINCT sequence_id) as total_attempted,
        SUM(CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END) as completed,
        AVG(CASE WHEN score IS NOT NULL THEN score ELSE 0 END) as avg_score,
        SUM(time_spent) as total_time
      FROM progress
      WHERE user_id = ?
    `, [req.user.id]);

    res.json({
      success: true,
      data: {
        user: users[0],
        stats: stats[0]
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user data'
    });
  }
});

/**
 * Update user profile
 * PUT /api/users/me
 */
router.put('/me', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updates.push('updated_at = NOW()');
    values.push(req.user.id);

    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      data: { updated: true }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

/**
 * Get user leaderboard
 * GET /api/users/leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const [leaderboard] = await db.query(`
      SELECT
        u.id,
        u.username,
        u.name,
        u.level,
        COUNT(DISTINCT p.sequence_id) as completed_sequences,
        AVG(p.score) as avg_score,
        SUM(p.time_spent) as total_time
      FROM users u
      LEFT JOIN progress p ON u.id = p.user_id AND p.completion_status = 'completed'
      WHERE u.role != 'guest'
      GROUP BY u.id
      ORDER BY completed_sequences DESC, avg_score DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

module.exports = router;
