import express from 'express';
import problemService from '../services/problem.service.js';

const router = express.Router();

/**
 * GET /api/problems/today/:moodleUserId
 * 오늘 푼 문제 조회 (Moodle에서 동기화)
 */
router.get('/today/:moodleUserId', async (req, res) => {
  try {
    const { moodleUserId } = req.params;
    const result = await problemService.syncTodayProblems(
      parseInt(moodleUserId)
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get today problems error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/problems/student/:studentId/today
 * 오늘 푼 문제 목록 조회 (DB에서)
 */
router.get('/student/:studentId/today', async (req, res) => {
  try {
    const { studentId } = req.params;
    const problems = await problemService.getTodayProblems(studentId);

    res.json({
      success: true,
      count: problems.length,
      data: problems
    });
  } catch (error) {
    console.error('Get student today problems error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/problems/student/:studentId/date/:date
 * 특정 날짜의 문제 목록 조회
 */
router.get('/student/:studentId/date/:date', async (req, res) => {
  try {
    const { studentId, date } = req.params;
    const targetDate = new Date(date);

    const problems = await problemService.getProblemsByDate(
      studentId,
      targetDate
    );

    res.json({
      success: true,
      count: problems.length,
      date,
      data: problems
    });
  } catch (error) {
    console.error('Get problems by date error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
