const axios = require('axios');
const { promisePool } = require('../config/database');

class MoodleService {
  constructor() {
    this.moodleUrl = process.env.MOODLE_URL;
    this.token = process.env.MOODLE_TOKEN;
    this.apiEndpoint = `${this.moodleUrl}/webservice/rest/server.php`;
  }

  /**
   * Moodle REST API 호출
   */
  async callMoodleAPI(functionName, params = {}) {
    try {
      const response = await axios.get(this.apiEndpoint, {
        params: {
          wstoken: this.token,
          wsfunction: functionName,
          moodlewsrestformat: 'json',
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Moodle API Error (${functionName}):`, error.message);
      throw error;
    }
  }

  /**
   * 퀴즈 정보 조회
   */
  async getQuizInfo(quizId) {
    return await this.callMoodleAPI('mod_quiz_get_quizzes_by_courses', {
      courseids: [quizId]
    });
  }

  /**
   * 퀴즈 통계 조회 (직접 DB 쿼리)
   */
  async getQuizStatistics(quizId) {
    const [rows] = await promisePool.query(`
      SELECT
        q.id as quiz_id,
        q.name as quiz_name,
        q.timeopen,
        q.timeclose,
        COUNT(DISTINCT qa.userid) as total_students,
        AVG(qa.sumgrades) as average_score,
        MAX(qa.sumgrades) as max_score,
        MIN(qa.sumgrades) as min_score,
        COUNT(qa.id) as total_attempts
      FROM mdl_quiz q
      LEFT JOIN mdl_quiz_attempts qa ON q.id = qa.quiz
      WHERE q.id = ?
      GROUP BY q.id
    `, [quizId]);

    return rows[0] || null;
  }

  /**
   * 문제별 통계 조회
   */
  async getQuestionStatistics(quizId) {
    const [rows] = await promisePool.query(`
      SELECT
        q.id as question_id,
        q.name as question_name,
        q.qtype as question_type,
        COUNT(qa.id) as total_attempts,
        SUM(CASE WHEN qa.rightanswer = qa.responsesummary THEN 1 ELSE 0 END) as correct_count,
        ROUND(
          SUM(CASE WHEN qa.rightanswer = qa.responsesummary THEN 1 ELSE 0 END) / COUNT(qa.id) * 100,
          2
        ) as correct_rate,
        AVG(qa.maxmark) as max_marks,
        AVG(qa.mark) as average_marks
      FROM mdl_quiz_slots qs
      JOIN mdl_question q ON qs.questionid = q.id
      LEFT JOIN mdl_question_attempts qa ON q.id = qa.questionid
      WHERE qs.quizid = ?
      GROUP BY q.id
      ORDER BY qs.slot
    `, [quizId]);

    return rows;
  }

  /**
   * 학생별 퀴즈 성적 조회
   */
  async getStudentQuizResults(studentId, quizId = null) {
    let query = `
      SELECT
        qa.id as attempt_id,
        qa.quiz as quiz_id,
        q.name as quiz_name,
        qa.userid as student_id,
        u.firstname,
        u.lastname,
        qa.attempt,
        qa.state,
        qa.sumgrades as score,
        q.sumgrades as max_score,
        ROUND((qa.sumgrades / q.sumgrades) * 100, 2) as percentage,
        qa.timefinish,
        qa.timestart,
        (qa.timefinish - qa.timestart) as time_taken
      FROM mdl_quiz_attempts qa
      JOIN mdl_quiz q ON qa.quiz = q.id
      JOIN mdl_user u ON qa.userid = u.id
      WHERE qa.userid = ?
    `;

    const params = [studentId];

    if (quizId) {
      query += ' AND qa.quiz = ?';
      params.push(quizId);
    }

    query += ' ORDER BY qa.timefinish DESC';

    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  /**
   * 코스별 전체 통계
   */
  async getCourseStatistics(courseId) {
    const [rows] = await promisePool.query(`
      SELECT
        c.id as course_id,
        c.fullname as course_name,
        COUNT(DISTINCT q.id) as total_quizzes,
        COUNT(DISTINCT qa.userid) as total_students,
        COUNT(DISTINCT qa.id) as total_attempts,
        AVG(qa.sumgrades) as average_score,
        COUNT(DISTINCT DATE(FROM_UNIXTIME(qa.timefinish))) as active_days
      FROM mdl_course c
      LEFT JOIN mdl_quiz q ON c.id = q.course
      LEFT JOIN mdl_quiz_attempts qa ON q.id = qa.quiz
      WHERE c.id = ? AND qa.state = 'finished'
      GROUP BY c.id
    `, [courseId]);

    return rows[0] || null;
  }

  /**
   * 시간대별 활동 통계 (히트맵용)
   */
  async getActivityHeatmap(courseId, startDate, endDate) {
    const [rows] = await promisePool.query(`
      SELECT
        DATE(FROM_UNIXTIME(qa.timefinish)) as date,
        HOUR(FROM_UNIXTIME(qa.timefinish)) as hour,
        COUNT(*) as activity_count,
        AVG(qa.sumgrades) as avg_score
      FROM mdl_quiz_attempts qa
      JOIN mdl_quiz q ON qa.quiz = q.id
      WHERE q.course = ?
        AND qa.state = 'finished'
        AND FROM_UNIXTIME(qa.timefinish) BETWEEN ? AND ?
      GROUP BY DATE(FROM_UNIXTIME(qa.timefinish)), HOUR(FROM_UNIXTIME(qa.timefinish))
      ORDER BY date, hour
    `, [courseId, startDate, endDate]);

    return rows;
  }

  /**
   * 난이도별 문제 분포
   */
  async getQuestionDifficultyDistribution(quizId) {
    const [rows] = await promisePool.query(`
      SELECT
        q.id,
        q.name,
        ROUND(
          SUM(CASE WHEN qa.rightanswer = qa.responsesummary THEN 1 ELSE 0 END) / COUNT(qa.id) * 100,
          2
        ) as correct_rate,
        CASE
          WHEN ROUND(SUM(CASE WHEN qa.rightanswer = qa.responsesummary THEN 1 ELSE 0 END) / COUNT(qa.id) * 100, 2) >= 80 THEN 'easy'
          WHEN ROUND(SUM(CASE WHEN qa.rightanswer = qa.responsesummary THEN 1 ELSE 0 END) / COUNT(qa.id) * 100, 2) >= 50 THEN 'medium'
          ELSE 'hard'
        END as difficulty,
        COUNT(qa.id) as attempt_count
      FROM mdl_quiz_slots qs
      JOIN mdl_question q ON qs.questionid = q.id
      LEFT JOIN mdl_question_attempts qa ON q.id = qa.questionid
      WHERE qs.quizid = ?
      GROUP BY q.id
    `, [quizId]);

    // 난이도별 집계
    const distribution = {
      easy: 0,
      medium: 0,
      hard: 0,
      details: rows
    };

    rows.forEach(row => {
      distribution[row.difficulty]++;
    });

    return distribution;
  }
}

module.exports = new MoodleService();
