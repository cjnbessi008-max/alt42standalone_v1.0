import express from 'express';
import problemService from '../services/problem.service.js';
import { query } from '../config/database.js';

const router = express.Router();

/**
 * GET /api/analytics/student/:studentId/pattern
 * 학습 패턴 생성 및 조회
 */
router.get('/student/:studentId/pattern', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { date } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    const pattern = await problemService.generateLearningPattern(
      studentId,
      targetDate
    );

    if (!pattern) {
      return res.json({
        success: true,
        message: '해당 날짜에 푼 문제가 없습니다',
        data: null
      });
    }

    res.json({
      success: true,
      data: pattern
    });
  } catch (error) {
    console.error('Get learning pattern error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/student/:studentId/summary
 * 오늘의 학습 요약
 */
router.get('/student/:studentId/summary', async (req, res) => {
  try {
    const { studentId } = req.params;

    const sql = `
      SELECT
        COUNT(*) as total_problems,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as incorrect_count,
        ROUND(AVG(CASE WHEN is_correct = 1 THEN 100 ELSE 0 END), 2) as accuracy_rate,
        SUM(time_spent_seconds) as total_time_seconds,
        MIN(attempted_at) as first_attempt,
        MAX(attempted_at) as last_attempt
      FROM problem_attempts
      WHERE student_id = ? AND DATE(attempted_at) = CURDATE()
    `;

    const results = await query(sql, [studentId]);
    const summary = results[0];

    res.json({
      success: true,
      data: {
        totalProblems: summary.total_problems || 0,
        correctCount: summary.correct_count || 0,
        incorrectCount: summary.incorrect_count || 0,
        accuracyRate: summary.accuracy_rate || 0,
        totalTimeMinutes: Math.round((summary.total_time_seconds || 0) / 60),
        firstAttempt: summary.first_attempt,
        lastAttempt: summary.last_attempt
      }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/student/:studentId/concepts
 * 개념별 성취도 조회
 */
router.get('/student/:studentId/concepts', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    let sql = `
      SELECT
        ct.id as concept_id,
        ct.name as concept_name,
        ct.category,
        COUNT(DISTINCT pa.problem_id) as problems_attempted,
        SUM(CASE WHEN pa.is_correct = 1 THEN 1 ELSE 0 END) as problems_correct,
        ROUND(AVG(CASE WHEN pa.is_correct = 1 THEN 100 ELSE 0 END), 2) as mastery_percentage
      FROM problem_attempts pa
      JOIN problems p ON pa.problem_id = p.id
      JOIN problem_concepts pc ON p.id = pc.problem_id
      JOIN concept_tags ct ON pc.concept_id = ct.id
      WHERE pa.student_id = ?
    `;

    const params = [studentId];

    if (startDate) {
      sql += ' AND DATE(pa.attempted_at) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND DATE(pa.attempted_at) <= ?';
      params.push(endDate);
    }

    sql += `
      GROUP BY ct.id, ct.name, ct.category
      HAVING problems_attempted >= 1
      ORDER BY mastery_percentage DESC
    `;

    const results = await query(sql, params);

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Get concept performance error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/student/:studentId/trends
 * 학습 추세 분석
 */
router.get('/student/:studentId/trends', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { days = 7 } = req.query;

    const sql = `
      SELECT
        DATE(attempted_at) as date,
        COUNT(*) as total_problems,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        ROUND(AVG(CASE WHEN is_correct = 1 THEN 100 ELSE 0 END), 2) as accuracy_rate,
        SUM(time_spent_seconds) as total_time_seconds
      FROM problem_attempts
      WHERE student_id = ?
        AND attempted_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(attempted_at)
      ORDER BY date ASC
    `;

    const results = await query(sql, [studentId, parseInt(days)]);

    res.json({
      success: true,
      period: `${days} days`,
      data: results.map(row => ({
        date: row.date,
        totalProblems: row.total_problems,
        correctCount: row.correct_count,
        accuracyRate: row.accuracy_rate || 0,
        totalTimeMinutes: Math.round(row.total_time_seconds / 60)
      }))
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
