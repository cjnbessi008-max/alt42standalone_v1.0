import express from 'express';
import { query } from '../config/database.js';
import moodleService from '../services/moodle.service.js';

const router = express.Router();

/**
 * GET /api/students/moodle/:moodleUserId
 * Moodle 사용자 정보 조회
 */
router.get('/moodle/:moodleUserId', async (req, res) => {
  try {
    const { moodleUserId } = req.params;
    const moodleUser = await moodleService.getUserById(parseInt(moodleUserId));

    if (!moodleUser) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다'
      });
    }

    // DB에서 학생 정보 조회
    const students = await query(
      'SELECT * FROM students WHERE moodle_user_id = ?',
      [moodleUserId]
    );

    res.json({
      success: true,
      data: {
        moodle: moodleUser,
        local: students[0] || null
      }
    });
  } catch (error) {
    console.error('Get Moodle user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/students/:studentId
 * 학생 정보 조회 (DB)
 */
router.get('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const students = await query('SELECT * FROM students WHERE id = ?', [
      studentId
    ]);

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        error: '학생을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      data: students[0]
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/students
 * 전체 학생 목록 조회
 */
router.get('/', async (req, res) => {
  try {
    const students = await query(
      'SELECT * FROM students ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
