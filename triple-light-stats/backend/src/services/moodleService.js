const { pool } = require('../config/database');

/**
 * Moodle Service
 * Handles all Moodle database queries
 */

class MoodleService {
  constructor() {
    this.prefix = process.env.MOODLE_PREFIX || 'mdl_';
  }

  /**
   * Get list of all quizzes
   * @returns {Promise<Array>} List of quizzes
   */
  async getQuizList() {
    const query = `
      SELECT
        q.id,
        q.name,
        q.intro,
        q.timeopen,
        q.timeclose,
        c.fullname as course_name,
        COUNT(DISTINCT qa.id) as attempt_count
      FROM ${this.prefix}quiz q
      LEFT JOIN ${this.prefix}course c ON q.course = c.id
      LEFT JOIN ${this.prefix}quiz_attempts qa ON q.id = qa.quiz
      WHERE q.visible = 1
      GROUP BY q.id, q.name, q.intro, q.timeopen, q.timeclose, c.fullname
      ORDER BY q.timemodified DESC
      LIMIT 50
    `;

    try {
      const [rows] = await pool.query(query);
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        intro: row.intro,
        courseName: row.course_name,
        timeOpen: row.timeopen,
        timeClose: row.timeclose,
        attemptCount: parseInt(row.attempt_count) || 0
      }));
    } catch (error) {
      console.error('Error fetching quiz list:', error);
      throw new Error('Failed to fetch quiz list');
    }
  }

  /**
   * Get quiz details by ID
   * @param {number} quizId - Quiz ID
   * @returns {Promise<object>} Quiz details
   */
  async getQuizDetails(quizId) {
    const query = `
      SELECT
        q.id,
        q.name,
        q.intro,
        q.grade as max_grade,
        c.fullname as course_name
      FROM ${this.prefix}quiz q
      LEFT JOIN ${this.prefix}course c ON q.course = c.id
      WHERE q.id = ?
    `;

    try {
      const [rows] = await pool.query(query, [quizId]);
      if (rows.length === 0) {
        throw new Error('Quiz not found');
      }

      return {
        id: rows[0].id,
        name: rows[0].name,
        intro: rows[0].intro,
        maxGrade: parseFloat(rows[0].max_grade),
        courseName: rows[0].course_name
      };
    } catch (error) {
      console.error('Error fetching quiz details:', error);
      throw new Error('Failed to fetch quiz details');
    }
  }

  /**
   * Get all final grades for a quiz
   * @param {number} quizId - Quiz ID
   * @returns {Promise<Array>} Array of grade values
   */
  async getQuizGrades(quizId) {
    const query = `
      SELECT
        qg.grade,
        qg.userid,
        u.firstname,
        u.lastname
      FROM ${this.prefix}quiz_grades qg
      LEFT JOIN ${this.prefix}user u ON qg.userid = u.id
      WHERE qg.quiz = ?
      AND qg.grade IS NOT NULL
      ORDER BY qg.timemodified DESC
    `;

    try {
      const [rows] = await pool.query(query, [quizId]);
      return rows.map(row => ({
        grade: parseFloat(row.grade),
        userId: row.userid,
        firstName: row.firstname,
        lastName: row.lastname
      }));
    } catch (error) {
      console.error('Error fetching quiz grades:', error);
      throw new Error('Failed to fetch quiz grades');
    }
  }

  /**
   * Get all attempt scores for a quiz
   * @param {number} quizId - Quiz ID
   * @returns {Promise<Array>} Array of attempt scores
   */
  async getQuizAttempts(quizId) {
    const query = `
      SELECT
        qa.id,
        qa.userid,
        qa.sumgrades,
        qa.timefinish,
        u.firstname,
        u.lastname
      FROM ${this.prefix}quiz_attempts qa
      LEFT JOIN ${this.prefix}user u ON qa.userid = u.id
      WHERE qa.quiz = ?
      AND qa.state = 'finished'
      AND qa.sumgrades IS NOT NULL
      ORDER BY qa.timefinish DESC
    `;

    try {
      const [rows] = await pool.query(query, [quizId]);
      return rows.map(row => ({
        id: row.id,
        userId: row.userid,
        grade: parseFloat(row.sumgrades),
        timeFinish: row.timefinish,
        firstName: row.firstname,
        lastName: row.lastname
      }));
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      throw new Error('Failed to fetch quiz attempts');
    }
  }

  /**
   * Get question-level statistics
   * @param {number} quizId - Quiz ID
   * @returns {Promise<Array>} Array of question statistics
   */
  async getQuestionStats(quizId) {
    const query = `
      SELECT
        q.id,
        q.name,
        q.questiontext,
        AVG(qas.fraction) as avg_score,
        COUNT(qas.id) as attempt_count
      FROM ${this.prefix}quiz_slots qs
      JOIN ${this.prefix}question q ON qs.questionid = q.id
      LEFT JOIN ${this.prefix}question_attempts qa ON q.id = qa.questionid
      LEFT JOIN ${this.prefix}question_attempt_steps qas ON qa.id = qas.questionattemptid
      WHERE qs.quizid = ?
      AND qas.state = 'gradedright' OR qas.state = 'gradedwrong' OR qas.state = 'gradedpartial'
      GROUP BY q.id, q.name, q.questiontext
      ORDER BY qs.slot
    `;

    try {
      const [rows] = await pool.query(query, [quizId]);
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        questionText: row.questiontext,
        avgScore: parseFloat(row.avg_score) || 0,
        attemptCount: parseInt(row.attempt_count) || 0
      }));
    } catch (error) {
      console.error('Error fetching question stats:', error);
      throw new Error('Failed to fetch question statistics');
    }
  }
}

module.exports = new MoodleService();
