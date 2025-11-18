/**
 * Moodle LMS 연동 라우트
 * /api/moodle
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

const MOODLE_URL = process.env.MOODLE_URL || 'http://localhost/moodle';
const MOODLE_WS_TOKEN = process.env.MOODLE_WS_TOKEN || '';

/**
 * Moodle REST API 호출 헬퍼
 */
async function callMoodleWebService(wsfunction, params = {}) {
  try {
    const response = await axios.post(
      `${MOODLE_URL}/webservice/rest/server.php`,
      null,
      {
        params: {
          wstoken: MOODLE_WS_TOKEN,
          wsfunction,
          moodlewsrestformat: 'json',
          ...params
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Moodle API 호출 실패 (${wsfunction}):`, error.message);
    throw error;
  }
}

/**
 * POST /api/moodle/webservice
 * Moodle 웹서비스 프록시
 */
router.post('/webservice', async (req, res, next) => {
  try {
    const { wsfunction, ...params } = req.body;

    if (!wsfunction) {
      return res.status(400).json({
        success: false,
        error: 'wsfunction 파라미터가 필요합니다.'
      });
    }

    const data = await callMoodleWebService(wsfunction, params);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/moodle/sync
 * Moodle과 문제 동기화
 */
router.get('/sync', async (req, res, next) => {
  try {
    // 예시: Moodle 퀴즈 목록 가져오기
    const courses = await callMoodleWebService('core_course_get_courses');

    res.json({
      success: true,
      data: {
        message: 'Moodle 동기화 완료',
        courses: courses.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/moodle/quizzes/:courseId
 * 특정 코스의 퀴즈 목록
 */
router.get('/quizzes/:courseId', async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const quizzes = await callMoodleWebService(
      'mod_quiz_get_quizzes_by_courses',
      { courseids: [courseId] }
    );

    res.json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/moodle/course/:courseId/contents
 * 코스 컨텐츠 조회
 */
router.get('/course/:courseId/contents', async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const contents = await callMoodleWebService(
      'core_course_get_contents',
      { courseid: courseId }
    );

    res.json({
      success: true,
      data: contents
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/moodle/user/:userId
 * 사용자 정보 조회
 */
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const users = await callMoodleWebService(
      'core_user_get_users_by_field',
      { field: 'id', values: [userId] }
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
