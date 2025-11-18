/**
 * 학습 진행도 라우트
 * /api/progress
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

/**
 * GET /api/progress
 * 진행도 조회
 */
router.get('/', async (req, res, next) => {
  try {
    const { user_id, problem_id } = req.query;

    let sql = 'SELECT * FROM user_progress WHERE 1=1';
    const params = [];

    if (user_id) {
      sql += ' AND user_id = ?';
      params.push(user_id);
    }

    if (problem_id) {
      sql += ' AND problem_id = ?';
      params.push(problem_id);
    }

    sql += ' ORDER BY created_at DESC';

    const progressList = await query(sql, params);

    res.json({
      success: true,
      data: progressList
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/progress
 * 진행도 저장
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      user_id,
      problem_id,
      scale_value,
      completed,
      score
    } = req.body;

    const result = await query(
      `INSERT INTO user_progress
       (user_id, problem_id, scale_value, completed, score)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, problem_id, scale_value, completed || false, score || 0]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        message: '진행도가 저장되었습니다.'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/progress/stats/:user_id
 * 사용자 통계 조회
 */
router.get('/stats/:user_id', async (req, res, next) => {
  try {
    const { user_id } = req.params;

    const stats = await query(
      `SELECT
         COUNT(*) as total_attempts,
         SUM(completed) as completed_count,
         AVG(score) as average_score,
         MAX(score) as max_score
       FROM user_progress
       WHERE user_id = ?`,
      [user_id]
    );

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
