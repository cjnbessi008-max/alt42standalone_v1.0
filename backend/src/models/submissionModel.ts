import db from '../config/database';
import { Submission, ErrorAnalysis } from '../types';
import { NotFoundError } from '../utils/errors';

export class SubmissionModel {
  /**
   * Create a new submission
   */
  async create(data: {
    student_id: string;
    problem_id: string;
    student_answer: Record<string, unknown>;
    is_correct: boolean;
    is_equivalent: boolean;
    error_type: string | null;
    error_analysis?: ErrorAnalysis;
    time_spent_seconds?: number;
  }): Promise<Submission> {
    // Get the attempt number for this student and problem
    const attemptResult = await db.query(
      `SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt
       FROM submissions
       WHERE student_id = $1 AND problem_id = $2`,
      [data.student_id, data.problem_id]
    );

    const attemptNumber = attemptResult.rows[0].next_attempt;

    const result = await db.query(
      `INSERT INTO submissions (
        student_id, problem_id, student_answer, is_correct, is_equivalent,
        error_type, error_analysis, time_spent_seconds, attempt_number
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        data.student_id,
        data.problem_id,
        JSON.stringify(data.student_answer),
        data.is_correct,
        data.is_equivalent,
        data.error_type,
        data.error_analysis ? JSON.stringify(data.error_analysis) : null,
        data.time_spent_seconds,
        attemptNumber,
      ]
    );

    return result.rows[0];
  }

  /**
   * Get submission by ID
   */
  async getById(id: string): Promise<Submission> {
    const result = await db.query('SELECT * FROM submissions WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError(`Submission with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Get submissions by student
   */
  async getByStudent(
    studentId: string,
    filters?: { problem_id?: string; limit?: number; offset?: number }
  ): Promise<Submission[]> {
    let query = `
      SELECT s.*, p.type as problem_type, p.difficulty
      FROM submissions s
      JOIN problems p ON s.problem_id = p.id
      WHERE s.student_id = $1
    `;
    const params: unknown[] = [studentId];

    if (filters?.problem_id) {
      params.push(filters.problem_id);
      query += ` AND s.problem_id = $${params.length}`;
    }

    query += ' ORDER BY s.submitted_at DESC';

    if (filters?.limit) {
      params.push(filters.limit);
      query += ` LIMIT $${params.length}`;
    }

    if (filters?.offset) {
      params.push(filters.offset);
      query += ` OFFSET $${params.length}`;
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get submissions by problem
   */
  async getByProblem(problemId: string, limit = 100): Promise<Submission[]> {
    const result = await db.query(
      `SELECT s.*, u.name as student_name
       FROM submissions s
       JOIN users u ON s.student_id = u.id
       WHERE s.problem_id = $1
       ORDER BY s.submitted_at DESC
       LIMIT $2`,
      [problemId, limit]
    );

    return result.rows;
  }

  /**
   * Get error statistics for a student
   */
  async getErrorStats(studentId: string): Promise<
    Array<{
      error_type: string;
      count: number;
      percentage: number;
    }>
  > {
    const result = await db.query(
      `SELECT
        error_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
       FROM submissions
       WHERE student_id = $1 AND error_type IS NOT NULL
       GROUP BY error_type
       ORDER BY count DESC`,
      [studentId]
    );

    return result.rows;
  }
}

export default new SubmissionModel();
