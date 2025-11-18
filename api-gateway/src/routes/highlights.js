/**
 * Highlight Clips Routes
 * Handles highlight clip management and daily recommendations
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
// GET DAILY HIGHLIGHTS
// ============================================================================

router.get('/daily', async (req, res, next) => {
  try {
    const { date, grade_level } = req.query;

    // Forward to Python pipeline service
    const response = await axios.get(`${PIPELINE_URL}/api/highlights/daily`, {
      params: { target_date: date, grade_level }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching daily highlights:', error.message);
    next(error);
  }
});

// ============================================================================
// GENERATE DAILY HIGHLIGHTS
// ============================================================================

router.post('/daily/generate', async (req, res, next) => {
  try {
    // Trigger daily highlight generation
    const response = await axios.post(`${PIPELINE_URL}/api/highlights/daily/generate`);

    res.json({
      message: 'Daily highlight generation started',
      data: response.data
    });
  } catch (error) {
    console.error('Error generating daily highlights:', error.message);
    next(error);
  }
});

// ============================================================================
// GET HIGHLIGHT BY ID
// ============================================================================

router.get('/:highlightId', async (req, res, next) => {
  try {
    const { highlightId } = req.params;

    const result = await pool.query(`
      SELECT id, module_id, title, description, clip_type, content,
             key_concepts, difficulty_level, estimated_duration_minutes,
             order_index, is_featured, metadata, created_at, updated_at
      FROM highlight_clips
      WHERE id = $1
    `, [highlightId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Highlight clip not found'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching highlight:', error.message);
    next(error);
  }
});

// ============================================================================
// GET HIGHLIGHT ANALYTICS
// ============================================================================

router.get('/:highlightId/analytics', async (req, res, next) => {
  try {
    const { highlightId } = req.params;
    const { start_date, end_date } = req.query;

    let query = `
      SELECT date, total_views, unique_students, avg_completion_rate,
             avg_time_spent_seconds, success_rate
      FROM clip_analytics
      WHERE clip_id = $1
    `;
    const params = [highlightId];

    if (start_date) {
      query += ` AND date >= $${params.length + 1}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND date <= $${params.length + 1}`;
      params.push(end_date);
    }

    query += ' ORDER BY date DESC';

    const result = await pool.query(query, params);

    res.json({
      clip_id: highlightId,
      analytics: result.rows
    });
  } catch (error) {
    console.error('Error fetching analytics:', error.message);
    next(error);
  }
});

// ============================================================================
// SEARCH HIGHLIGHTS
// ============================================================================

router.get('/', async (req, res, next) => {
  try {
    const {
      clip_type,
      difficulty_level,
      grade_level,
      featured,
      search,
      limit = 20,
      offset = 0
    } = req.query;

    let query = `
      SELECT hc.id, hc.module_id, hc.title, hc.description, hc.clip_type,
             hc.key_concepts, hc.difficulty_level, hc.estimated_duration_minutes,
             hc.is_featured, m.grade_level, m.subject
      FROM highlight_clips hc
      JOIN modules m ON hc.module_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (clip_type) {
      params.push(clip_type);
      query += ` AND hc.clip_type = $${params.length}`;
    }

    if (difficulty_level) {
      params.push(difficulty_level);
      query += ` AND hc.difficulty_level = $${params.length}`;
    }

    if (grade_level) {
      params.push(grade_level);
      query += ` AND m.grade_level = $${params.length}`;
    }

    if (featured === 'true') {
      query += ' AND hc.is_featured = true';
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (hc.title ILIKE $${params.length} OR hc.description ILIKE $${params.length})`;
    }

    query += ` ORDER BY hc.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countQuery = query.split('ORDER BY')[0].replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      highlights: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: totalCount > parseInt(offset) + result.rows.length
      }
    });
  } catch (error) {
    console.error('Error searching highlights:', error.message);
    next(error);
  }
});

module.exports = router;
