const { query } = require('../config/database');

/**
 * Get student progress for a module
 */
const getStudentProgress = async (studentId, moduleId) => {
  const result = await query(
    'SELECT * FROM student_progress WHERE student_id = $1 AND module_id = $2',
    [studentId, moduleId]
  );

  return result.rows[0] || null;
};

/**
 * Select a problem from the problem bank based on difficulty level
 */
const selectProblem = async (moduleId, difficultyLevel) => {
  const result = await query(
    `SELECT * FROM problem_bank
     WHERE module_id = $1 AND difficulty_level = $2 AND is_active = true
     ORDER BY RANDOM()
     LIMIT 1`,
    [moduleId, difficultyLevel]
  );

  return result.rows[0] || null;
};

/**
 * Get recent attempts to check for consecutive correct answers
 */
const getRecentAttempts = async (studentId, moduleId, limit = 10) => {
  const result = await query(
    `SELECT * FROM problem_attempt
     WHERE student_id = $1 AND module_id = $2
     ORDER BY attempted_at DESC
     LIMIT $3`,
    [studentId, moduleId, limit]
  );

  return result.rows;
};

/**
 * Calculate consecutive correct answers
 */
const getConsecutiveCorrect = (attempts) => {
  let consecutive = 0;
  for (const attempt of attempts) {
    if (attempt.is_correct) {
      consecutive++;
    } else {
      break;
    }
  }
  return consecutive;
};

module.exports = {
  getStudentProgress,
  selectProblem,
  getRecentAttempts,
  getConsecutiveCorrect,
};
