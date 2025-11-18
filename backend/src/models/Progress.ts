import pool from '../config/database';
import { StudentProgress, ProblemAttempt, EquationStep } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class ProgressModel {
  static async getByStudentId(studentId: number): Promise<StudentProgress[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT sp.*, p.title as problem_title, p.difficulty_level
       FROM student_progress sp
       JOIN problems p ON sp.problem_id = p.id
       WHERE sp.student_id = ?
       ORDER BY sp.last_attempt_at DESC`,
      [studentId]
    );

    return rows as StudentProgress[];
  }

  static async getByStudentAndProblem(
    studentId: number,
    problemId: number
  ): Promise<StudentProgress | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM student_progress WHERE student_id = ? AND problem_id = ?',
      [studentId, problemId]
    );

    if (rows.length === 0) return null;
    return rows[0] as StudentProgress;
  }

  static async create(progressData: {
    student_id: number;
    problem_id: number;
  }): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO student_progress (student_id, problem_id, status, started_at)
       VALUES (?, ?, 'in_progress', NOW())`,
      [progressData.student_id, progressData.problem_id]
    );

    return result.insertId;
  }

  static async update(
    studentId: number,
    problemId: number,
    updates: Partial<StudentProgress>
  ): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'student_id' && key !== 'problem_id') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    values.push(studentId, problemId);
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE student_progress SET ${fields.join(', ')}
       WHERE student_id = ? AND problem_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async recordAttempt(attemptData: {
    progress_id: number;
    student_id: number;
    problem_id: number;
    attempt_number: number;
    steps_taken: EquationStep[];
    student_answer?: string;
    is_correct: boolean;
    score: number;
    time_spent: number;
    hints_used_in_attempt: number;
    error_type?: string;
  }): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO problem_attempts
       (progress_id, student_id, problem_id, attempt_number, steps_taken,
        student_answer, is_correct, score, time_spent, hints_used_in_attempt, error_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        attemptData.progress_id,
        attemptData.student_id,
        attemptData.problem_id,
        attemptData.attempt_number,
        JSON.stringify(attemptData.steps_taken),
        attemptData.student_answer,
        attemptData.is_correct,
        attemptData.score,
        attemptData.time_spent,
        attemptData.hints_used_in_attempt,
        attemptData.error_type,
      ]
    );

    return result.insertId;
  }

  static async getAttempts(
    studentId: number,
    problemId: number
  ): Promise<ProblemAttempt[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM problem_attempts
       WHERE student_id = ? AND problem_id = ?
       ORDER BY attempted_at DESC`,
      [studentId, problemId]
    );

    return rows.map((row: any) => ({
      ...row,
      steps_taken: typeof row.steps_taken === 'string'
        ? JSON.parse(row.steps_taken)
        : row.steps_taken,
    })) as ProblemAttempt[];
  }

  static async getStats(studentId: number): Promise<{
    total_problems: number;
    completed: number;
    in_progress: number;
    avg_score: number;
    total_time: number;
  }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COUNT(*) as total_problems,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
         SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
         AVG(final_score) as avg_score,
         SUM(time_spent) as total_time
       FROM student_progress
       WHERE student_id = ?`,
      [studentId]
    );

    return rows[0] as any;
  }
}
