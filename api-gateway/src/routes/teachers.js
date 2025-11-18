/**
 * Teachers Routes
 * Handles teacher data and authentication
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// ============================================================================
// GET TEACHER INFO
// ============================================================================

router.get('/:teacherId', async (req, res, next) => {
  try {
    const { teacherId } = req.params;

    const result = await pool.query(`
      SELECT id, name, email, institution, role, preferences, created_at
      FROM teachers
      WHERE id = $1
    `, [teacherId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Teacher not found'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching teacher:', error.message);
    next(error);
  }
});

// ============================================================================
// GET TEACHER'S MODULES
// ============================================================================

router.get('/:teacherId/modules', async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT id, name, description, subject, grade_level, status, created_at, updated_at
      FROM modules
      WHERE teacher_id = $1
    `;
    const params = [teacherId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      modules: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching teacher modules:', error.message);
    next(error);
  }
});

// ============================================================================
// LIST TEACHERS
// ============================================================================

router.get('/', async (req, res, next) => {
  try {
    const { role, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT id, name, email, institution, role, created_at FROM teachers WHERE 1=1';
    const params = [];

    if (role) {
      params.push(role);
      query += ` AND role = $${params.length}`;
    }

    query += ` ORDER BY name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      teachers: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error listing teachers:', error.message);
    next(error);
  }
});

module.exports = router;
