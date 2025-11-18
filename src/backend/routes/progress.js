const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Get user progress
 * GET /api/progress
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const [progress] = await db.query(`
      SELECT
        p.*,
        s.name as sequence_name,
        s.difficulty_level
      FROM progress p
      JOIN sequences s ON p.sequence_id = s.id
      WHERE p.user_id = ?
      ORDER BY p.updated_at DESC
    `, [req.user.id]);

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progress'
    });
  }
});

/**
 * Save/update progress
 * POST /api/progress
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { sequence_id, completion_status, time_spent, score, interaction_data } = req.body;
    const userId = req.user.id;

    // Check if progress exists
    const [existing] = await db.query(
      'SELECT * FROM progress WHERE user_id = ? AND sequence_id = ?',
      [userId, sequence_id]
    );

    let result;
    if (existing.length > 0) {
      // Update existing progress
      [result] = await db.query(`
        UPDATE progress
        SET completion_status = ?,
            time_spent = time_spent + ?,
            score = GREATEST(IFNULL(score, 0), ?),
            interaction_count = interaction_count + 1,
            last_interaction = NOW(),
            updated_at = NOW()
        WHERE user_id = ? AND sequence_id = ?
      `, [completion_status, time_spent || 0, score || 0, userId, sequence_id]);
    } else {
      // Create new progress
      [result] = await db.query(`
        INSERT INTO progress
        (user_id, sequence_id, completion_status, time_spent, score, interaction_count, last_interaction, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW(), NOW())
      `, [userId, sequence_id, completion_status, time_spent || 0, score || 0]);
    }

    // Log interaction
    if (interaction_data) {
      await db.query(`
        INSERT INTO interactions (user_id, sequence_id, interaction_type, interaction_data, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [userId, sequence_id, interaction_data.type || 'progress', JSON.stringify(interaction_data)]);
    }

    // Update user level if needed
    if (completion_status === 'completed' && score >= 80) {
      await updateUserLevel(userId);
    }

    res.json({
      success: true,
      data: { updated: true }
    });
  } catch (error) {
    console.error('Save progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save progress'
    });
  }
});

/**
 * Get progress statistics
 * GET /api/progress/stats
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [stats] = await db.query(`
      SELECT
        COUNT(DISTINCT sequence_id) as total_sequences_attempted,
        SUM(CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END) as completed_sequences,
        AVG(CASE WHEN score IS NOT NULL THEN score ELSE 0 END) as average_score,
        SUM(time_spent) as total_time_spent,
        SUM(interaction_count) as total_interactions
      FROM progress
      WHERE user_id = ?
    `, [userId]);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

/**
 * Update user level based on progress
 */
async function updateUserLevel(userId) {
  try {
    const [completed] = await db.query(`
      SELECT COUNT(*) as count
      FROM progress
      WHERE user_id = ? AND completion_status = 'completed' AND score >= 80
    `, [userId]);

    const completedCount = completed[0].count;
    let newLevel = 1;

    if (completedCount >= 15) newLevel = 5;
    else if (completedCount >= 10) newLevel = 4;
    else if (completedCount >= 6) newLevel = 3;
    else if (completedCount >= 3) newLevel = 2;

    await db.query(
      'UPDATE users SET level = ?, updated_at = NOW() WHERE id = ?',
      [newLevel, userId]
    );
  } catch (error) {
    console.error('Update level error:', error);
  }
}

module.exports = router;
