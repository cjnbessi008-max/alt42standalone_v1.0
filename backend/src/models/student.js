import pool from '../db/connection.js';

/**
 * Student Model
 */

/**
 * Create or update student
 */
export async function upsertStudent(studentId, name, email = null) {
  const result = await pool.query(
    `INSERT INTO students (student_id, name, email)
     VALUES ($1, $2, $3)
     ON CONFLICT (student_id)
     DO UPDATE SET name = $2, email = $3, updated_at = NOW()
     RETURNING *`,
    [studentId, name, email]
  );
  return result.rows[0];
}

/**
 * Get student by student_id
 */
export async function getStudent(studentId) {
  const result = await pool.query(
    'SELECT * FROM students WHERE student_id = $1',
    [studentId]
  );
  return result.rows[0];
}

/**
 * Get all students
 */
export async function getAllStudents() {
  const result = await pool.query(
    'SELECT * FROM students ORDER BY created_at DESC'
  );
  return result.rows;
}
