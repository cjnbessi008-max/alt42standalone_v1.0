const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// Get all users
router.get('/', async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const [users] = await db.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user's quiz history
router.get('/:id/history', async (req, res) => {
  try {
    const userId = req.params.id;

    const [attempts] = await db.query(`
      SELECT
        qa.id,
        qa.quiz_id,
        q.title as quiz_title,
        qa.started_at,
        qa.completed_at,
        qa.score,
        qa.earned_points,
        qa.total_points,
        qa.is_completed
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      WHERE qa.user_id = ?
      ORDER BY qa.started_at DESC
    `, [userId]);

    res.json(attempts);
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    res.status(500).json({ error: 'Failed to fetch quiz history' });
  }
});

module.exports = router;
