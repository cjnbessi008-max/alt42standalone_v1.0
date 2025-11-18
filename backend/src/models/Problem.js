const { pool } = require('../config/database');

class Problem {
  /**
   * Get all problems
   */
  static async getAll() {
    const [rows] = await pool.query(
      'SELECT * FROM problems ORDER BY created_at DESC'
    );
    return rows;
  }

  /**
   * Get problem by ID with intervals
   */
  static async getById(id) {
    const [problems] = await pool.query(
      'SELECT * FROM problems WHERE id = ?',
      [id]
    );

    if (problems.length === 0) {
      return null;
    }

    const problem = problems[0];

    // Get associated intervals
    const [intervals] = await pool.query(
      `SELECT * FROM function_intervals
       WHERE problem_id = ?
       ORDER BY interval_start ASC`,
      [id]
    );

    return {
      ...problem,
      intervals
    };
  }

  /**
   * Get problem by Moodle ID
   */
  static async getByMoodleId(moodleId) {
    const [problems] = await pool.query(
      'SELECT * FROM problems WHERE moodle_problem_id = ?',
      [moodleId]
    );

    if (problems.length === 0) {
      return null;
    }

    const problem = problems[0];

    // Get associated intervals
    const [intervals] = await pool.query(
      `SELECT * FROM function_intervals
       WHERE problem_id = ?
       ORDER BY interval_start ASC`,
      [problem.id]
    );

    return {
      ...problem,
      intervals
    };
  }

  /**
   * Create new problem
   */
  static async create(problemData) {
    const {
      moodle_problem_id,
      title,
      description,
      function_expression,
      domain_start,
      domain_end,
      difficulty_level
    } = problemData;

    const [result] = await pool.query(
      `INSERT INTO problems
       (moodle_problem_id, title, description, function_expression,
        domain_start, domain_end, difficulty_level)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        moodle_problem_id,
        title,
        description,
        function_expression,
        domain_start,
        domain_end,
        difficulty_level
      ]
    );

    return this.getById(result.insertId);
  }

  /**
   * Update problem
   */
  static async update(id, problemData) {
    const fields = [];
    const values = [];

    Object.keys(problemData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(problemData[key]);
    });

    values.push(id);

    await pool.query(
      `UPDATE problems SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.getById(id);
  }

  /**
   * Delete problem
   */
  static async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM problems WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  /**
   * Get smooth (differentiable) intervals for a problem
   */
  static async getSmoothIntervals(problemId) {
    const [intervals] = await pool.query(
      `SELECT * FROM function_intervals
       WHERE problem_id = ? AND is_differentiable = 1
       ORDER BY interval_start ASC`,
      [problemId]
    );

    return intervals;
  }

  /**
   * Add interval to problem
   */
  static async addInterval(intervalData) {
    const {
      problem_id,
      interval_start,
      interval_end,
      is_differentiable,
      interval_type,
      notes
    } = intervalData;

    const [result] = await pool.query(
      `INSERT INTO function_intervals
       (problem_id, interval_start, interval_end, is_differentiable,
        interval_type, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        problem_id,
        interval_start,
        interval_end,
        is_differentiable,
        interval_type,
        notes
      ]
    );

    return result.insertId;
  }
}

module.exports = Problem;
