/**
 * Modules Routes
 * Handles educational module management
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const PIPELINE_URL = process.env.PIPELINE_SERVICE_URL || 'http://pipeline:8000';

// ============================================================================
// CREATE MODULE
// ============================================================================

router.post('/', async (req, res, next) => {
  try {
    const { name, description, subject, grade_level, teacher_id } = req.body;

    // Validation
    if (!name || !description || !grade_level || !teacher_id) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required fields: name, description, grade_level, teacher_id'
      });
    }

    // Forward to Python pipeline for processing
    const response = await axios.post(`${PIPELINE_URL}/api/modules`, {
      name,
      description,
      subject: subject || 'mathematics',
      grade_level,
      teacher_id
    });

    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating module:', error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    next(error);
  }
});

// ============================================================================
// GET MODULE BY ID
// ============================================================================

router.get('/:moduleId', async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    const response = await axios.get(`${PIPELINE_URL}/api/modules/${moduleId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching module:', error.message);
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Module not found'
      });
    }
    next(error);
  }
});

// ============================================================================
// GET MODULE HIGHLIGHTS
// ============================================================================

router.get('/:moduleId/highlights', async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    const response = await axios.get(`${PIPELINE_URL}/api/modules/${moduleId}/highlights`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching module highlights:', error.message);
    next(error);
  }
});

// ============================================================================
// GENERATE HIGHLIGHTS FOR MODULE
// ============================================================================

router.post('/:moduleId/highlights/generate', async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    const response = await axios.post(
      `${PIPELINE_URL}/api/modules/${moduleId}/highlights/generate`
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error generating highlights:', error.message);
    next(error);
  }
});

// ============================================================================
// LIST MODULES
// ============================================================================

router.get('/', async (req, res, next) => {
  try {
    const {
      teacher_id,
      status,
      subject,
      grade_level,
      limit = 20,
      offset = 0
    } = req.query;

    let query = `
      SELECT id, name, description, subject, grade_level, teacher_id,
             status, version, created_at, updated_at
      FROM modules
      WHERE 1=1
    `;
    const params = [];

    if (teacher_id) {
      params.push(teacher_id);
      query += ` AND teacher_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (subject) {
      params.push(subject);
      query += ` AND subject = $${params.length}`;
    }

    if (grade_level) {
      params.push(grade_level);
      query += ` AND grade_level = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countQuery = query.split('ORDER BY')[0].replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      modules: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: totalCount > parseInt(offset) + result.rows.length
      }
    });
  } catch (error) {
    console.error('Error listing modules:', error.message);
    next(error);
  }
});

// ============================================================================
// UPDATE MODULE
// ============================================================================

router.patch('/:moduleId', async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const updates = req.body;

    const allowedFields = ['name', 'description', 'status'];
    const updateFields = [];
    const params = [moduleId];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        params.push(updates[key]);
        updateFields.push(`${key} = $${params.length}`);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'No valid fields to update'
      });
    }

    const query = `
      UPDATE modules
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Module not found'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating module:', error.message);
    next(error);
  }
});

// ============================================================================
// DELETE MODULE
// ============================================================================

router.delete('/:moduleId', async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    const result = await pool.query(
      'DELETE FROM modules WHERE id = $1 RETURNING id',
      [moduleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Module not found'
      });
    }

    res.json({
      message: 'Module deleted successfully',
      id: moduleId
    });
  } catch (error) {
    console.error('Error deleting module:', error.message);
    next(error);
  }
});

module.exports = router;
