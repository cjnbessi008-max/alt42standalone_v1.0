import pool from '../db/connection.js';

/**
 * Problem Model
 */

/**
 * Create or update problem
 */
export async function upsertProblem(problemId, moduleId, title, description = null, difficultyLevel = null, problemType = null) {
  const result = await pool.query(
    `INSERT INTO problems (problem_id, module_id, title, description, difficulty_level, problem_type)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (problem_id)
     DO UPDATE SET
       module_id = $2,
       title = $3,
       description = $4,
       difficulty_level = $5,
       problem_type = $6,
       updated_at = NOW()
     RETURNING *`,
    [problemId, moduleId, title, description, difficultyLevel, problemType]
  );
  return result.rows[0];
}

/**
 * Get problem by problem_id
 */
export async function getProblem(problemId) {
  const result = await pool.query(
    'SELECT * FROM problems WHERE problem_id = $1',
    [problemId]
  );
  return result.rows[0];
}

/**
 * Get all problems by module
 */
export async function getProblemsByModule(moduleId) {
  const result = await pool.query(
    'SELECT * FROM problems WHERE module_id = $1 ORDER BY created_at DESC',
    [moduleId]
  );
  return result.rows;
}

/**
 * Get all problems
 */
export async function getAllProblems() {
  const result = await pool.query(
    'SELECT * FROM problems ORDER BY created_at DESC'
  );
  return result.rows;
}
