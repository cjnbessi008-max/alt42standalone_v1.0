const express = require('express');
const db = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Get all sequences
 * GET /api/sequences
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const [sequences] = await db.query(`
      SELECT
        s.*,
        IFNULL(AVG(p.score), 0) as avg_score,
        COUNT(DISTINCT p.user_id) as completion_count
      FROM sequences s
      LEFT JOIN progress p ON s.id = p.sequence_id AND p.completion_status = 'completed'
      GROUP BY s.id
      ORDER BY s.difficulty_level, s.name
    `);

    res.json({
      success: true,
      data: sequences
    });
  } catch (error) {
    console.error('Get sequences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sequences'
    });
  }
});

/**
 * Get sequence by ID
 * GET /api/sequences/:id
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [sequences] = await db.query(
      'SELECT * FROM sequences WHERE id = ?',
      [id]
    );

    if (sequences.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Sequence not found'
      });
    }

    // Get user progress if authenticated
    let progress = null;
    if (req.user) {
      const [progressRows] = await db.query(
        'SELECT * FROM progress WHERE user_id = ? AND sequence_id = ?',
        [req.user.id, id]
      );
      progress = progressRows[0] || null;
    }

    res.json({
      success: true,
      data: {
        sequence: sequences[0],
        progress
      }
    });
  } catch (error) {
    console.error('Get sequence error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sequence'
    });
  }
});

/**
 * Get sequences by difficulty level
 * GET /api/sequences/level/:level
 */
router.get('/level/:level', optionalAuth, async (req, res) => {
  try {
    const { level } = req.params;

    const [sequences] = await db.query(
      'SELECT * FROM sequences WHERE difficulty_level = ? ORDER BY name',
      [level]
    );

    res.json({
      success: true,
      data: sequences
    });
  } catch (error) {
    console.error('Get sequences by level error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sequences'
    });
  }
});

module.exports = router;
