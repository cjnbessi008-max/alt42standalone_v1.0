/**
 * Activity Controller
 * 학습 활동 로그 관리
 */

const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');
const { broadcastToAll } = require('../websocket/handler');

/**
 * 활동 로그 조회
 */
async function getLogs(req, res) {
  try {
    const { limit = 50, offset = 0, type, userId } = req.query;

    let query = `
      SELECT
        al.id,
        al.user_id,
        al.student_name,
        al.activity_type,
        al.content,
        al.problem_id,
        al.is_correct,
        al.score,
        al.time_spent,
        al.created_at,
        p.title AS problem_title,
        p.problem_type
      FROM activity_logs al
      LEFT JOIN problems p ON al.problem_id = p.id
      WHERE 1=1
    `;

    const params = [];

    if (type) {
      query += ` AND al.activity_type = ?`;
      params.push(type);
    }

    if (userId) {
      query += ` AND al.user_id = ?`;
      params.push(userId);
    }

    query += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const logs = await db.query(query, params);

    res.json({
      success: true,
      data: {
        logs,
        count: logs.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get activity logs',
      message: error.message
    });
  }
}

/**
 * 활동 로그 생성
 */
async function createLog(req, res) {
  try {
    const {
      activityType,
      content,
      problemId = null,
      answerData = null,
      isCorrect = null,
      timeSpent = null,
      score = null
    } = req.body;

    const userId = req.user.userId;

    // 사용자 정보 조회
    const user = await db.queryOne(
      'SELECT username FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // 로그 삽입
    const result = await db.query(
      `INSERT INTO activity_logs
       (user_id, student_name, activity_type, content, problem_id,
        answer_data, is_correct, time_spent, score, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        user.username,
        activityType,
        content,
        problemId,
        answerData ? JSON.stringify(answerData) : null,
        isCorrect,
        timeSpent,
        score
      ]
    );

    const logId = result.insertId;

    // 생성된 로그 조회
    const newLog = await db.queryOne(
      `SELECT * FROM activity_logs WHERE id = ?`,
      [logId]
    );

    // WebSocket으로 실시간 브로드캐스트
    broadcastToAll({
      type: 'new_activity_log',
      payload: newLog
    });

    res.status(201).json({
      success: true,
      message: 'Activity log created successfully',
      data: newLog
    });
  } catch (error) {
    console.error('Create log error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create activity log',
      message: error.message
    });
  }
}

/**
 * 실시간 로그 스트림 (Server-Sent Events)
 */
function streamLogs(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 연결 유지를 위한 heartbeat
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // 클라이언트 연결 종료 시 정리
  req.on('close', () => {
    clearInterval(heartbeat);
  });
}

/**
 * 사용자별 통계
 */
async function getUserStats(req, res) {
  try {
    const { userId } = req.params;

    // 권한 확인: 자신의 통계만 조회 가능 (관리자 제외)
    if (req.user.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const stats = await db.queryOne(
      `SELECT
        COUNT(*) AS total_activities,
        SUM(CASE WHEN activity_type = 'correct' THEN 1 ELSE 0 END) AS correct_count,
        SUM(CASE WHEN activity_type = 'incorrect' THEN 1 ELSE 0 END) AS incorrect_count,
        SUM(CASE WHEN activity_type = 'hint' THEN 1 ELSE 0 END) AS hint_count,
        AVG(score) AS avg_score,
        SUM(time_spent) AS total_time_spent,
        MIN(created_at) AS first_activity,
        MAX(created_at) AS last_activity
       FROM activity_logs
       WHERE user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user statistics',
      message: error.message
    });
  }
}

/**
 * 전체 통계
 */
async function getOverallStats(req, res) {
  try {
    // 관리자 및 교사만 접근 가능
    if (!['admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or teacher role required.'
      });
    }

    const stats = await db.queryOne(
      `SELECT
        COUNT(DISTINCT user_id) AS total_users,
        COUNT(*) AS total_activities,
        SUM(CASE WHEN activity_type = 'correct' THEN 1 ELSE 0 END) AS total_correct,
        SUM(CASE WHEN activity_type = 'incorrect' THEN 1 ELSE 0 END) AS total_incorrect,
        AVG(score) AS avg_score,
        SUM(time_spent) AS total_time_spent
       FROM activity_logs
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    // 활동 유형별 통계
    const activityByType = await db.query(
      `SELECT
        activity_type,
        COUNT(*) AS count
       FROM activity_logs
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY activity_type`
    );

    res.json({
      success: true,
      data: {
        overall: stats,
        byType: activityByType
      }
    });
  } catch (error) {
    console.error('Get overall stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get overall statistics',
      message: error.message
    });
  }
}

module.exports = {
  getLogs,
  createLog,
  streamLogs,
  getUserStats,
  getOverallStats
};
