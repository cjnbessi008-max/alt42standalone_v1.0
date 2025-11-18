const express = require('express');
const { Pool } = require('pg');
const config = require('../config/config');

const router = express.Router();
const pool = new Pool(config.database);

/**
 * GET /api/v1/modules
 * List all modules
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ai_education.modules WHERE is_active = true ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/modules/:id
 * Get specific module
 */
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ai_education.modules WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
