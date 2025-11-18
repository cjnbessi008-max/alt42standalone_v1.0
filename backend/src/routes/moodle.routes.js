const express = require('express');
const router = express.Router();
const axios = require('axios');

// Moodle에서 문제 정보 수신
router.post('/problem', async (req, res, next) => {
  try {
    const {
      moodle_user_id,
      moodle_course_id,
      moodle_activity_id,
      problem_data
    } = req.body;

    // Moodle 세션 생성
    const db = require('../config/database');
    const { v4: uuidv4 } = require('uuid');

    const sessionId = uuidv4();
    const sessionToken = uuidv4();

    await db.query(
      `INSERT INTO moodle_sessions
       (id, moodle_user_id, moodle_course_id, moodle_activity_id, session_token)
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, moodle_user_id, moodle_course_id, moodle_activity_id, sessionToken]
    );

    res.json({
      success: true,
      session_id: sessionId,
      session_token: sessionToken,
      problem_data: problem_data
    });
  } catch (error) {
    next(error);
  }
});

// Moodle로 풀이 결과 전송
router.post('/submit', async (req, res, next) => {
  try {
    const {
      session_token,
      timeline_id,
      final_answer,
      is_correct,
      time_spent,
      steps_count
    } = req.body;

    // 세션 검증
    const db = require('../config/database');
    const [sessions] = await db.query(
      'SELECT * FROM moodle_sessions WHERE session_token = ? AND is_active = 1',
      [session_token]
    );

    if (sessions.length === 0) {
      return res.status(401).json({
        error: { message: 'Invalid or expired session token' }
      });
    }

    const session = sessions[0];

    // 세션에 timeline_id 연결
    await db.query(
      'UPDATE moodle_sessions SET timeline_id = ?, is_active = 0 WHERE id = ?',
      [timeline_id, session.id]
    );

    // Moodle 웹서비스로 결과 전송 (선택적)
    if (process.env.MOODLE_URL && process.env.MOODLE_TOKEN) {
      try {
        await axios.post(`${process.env.MOODLE_URL}/webservice/rest/server.php`, {
          wstoken: process.env.MOODLE_TOKEN,
          wsfunction: 'mod_alt42_submit_result',
          moodlewsrestformat: 'json',
          userid: session.moodle_user_id,
          courseid: session.moodle_course_id,
          activityid: session.moodle_activity_id,
          result: is_correct ? 1 : 0,
          answer: final_answer,
          timespent: time_spent,
          stepscount: steps_count
        });
      } catch (moodleError) {
        console.error('Error sending to Moodle:', moodleError.message);
        // Moodle 전송 실패는 치명적이지 않으므로 계속 진행
      }
    }

    res.json({
      success: true,
      message: 'Result submitted successfully',
      session_id: session.id
    });
  } catch (error) {
    next(error);
  }
});

// Moodle 세션 조회
router.get('/session/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const db = require('../config/database');

    const [sessions] = await db.query(
      'SELECT * FROM moodle_sessions WHERE session_token = ?',
      [token]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        error: { message: 'Session not found' }
      });
    }

    res.json({
      success: true,
      session: sessions[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
