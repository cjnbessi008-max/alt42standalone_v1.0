import pool from '../config/database';
import { StudentSession, StudentAttempt } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class StudentSessionModel {
  // Create new session
  static async create(
    session_id: string,
    student_name?: string,
    moodle_user_id?: number
  ): Promise<StudentSession> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO student_sessions (session_id, student_name, moodle_user_id)
       VALUES (?, ?, ?)`,
      [session_id, student_name || null, moodle_user_id || null]
    );

    const created = await this.getById(result.insertId);
    if (!created) {
      throw new Error('Failed to create session');
    }

    return created;
  }

  // Get session by ID
  static async getById(id: number): Promise<StudentSession | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM student_sessions WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.parseRow(rows[0]);
  }

  // Get session by session_id
  static async getBySessionId(
    session_id: string
  ): Promise<StudentSession | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM student_sessions WHERE session_id = ?',
      [session_id]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.parseRow(rows[0]);
  }

  // Update session stats
  static async updateStats(
    id: number,
    increment_attempted: boolean,
    increment_correct: boolean
  ): Promise<void> {
    let query = 'UPDATE student_sessions SET last_activity_at = NOW()';

    if (increment_attempted) {
      query += ', total_problems_attempted = total_problems_attempted + 1';
    }

    if (increment_correct) {
      query += ', total_correct_answers = total_correct_answers + 1';
    }

    query += ' WHERE id = ?';

    await pool.execute(query, [id]);
  }

  // Parse database row to StudentSession object
  private static parseRow(row: RowDataPacket): StudentSession {
    return {
      id: row.id,
      session_id: row.session_id,
      student_name: row.student_name,
      moodle_user_id: row.moodle_user_id,
      started_at: row.started_at,
      last_activity_at: row.last_activity_at,
      total_problems_attempted: row.total_problems_attempted,
      total_correct_answers: row.total_correct_answers,
    };
  }
}

export class StudentAttemptModel {
  // Create new attempt
  static async create(attempt: StudentAttempt): Promise<StudentAttempt> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO student_attempts
       (session_id, problem_id, student_answer, is_correct, time_spent_seconds, interaction_data)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        attempt.session_id,
        attempt.problem_id,
        attempt.student_answer,
        attempt.is_correct,
        attempt.time_spent_seconds || null,
        attempt.interaction_data
          ? JSON.stringify(attempt.interaction_data)
          : null,
      ]
    );

    const created = await this.getById(result.insertId);
    if (!created) {
      throw new Error('Failed to create attempt');
    }

    return created;
  }

  // Get attempt by ID
  static async getById(id: number): Promise<StudentAttempt | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM student_attempts WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.parseRow(rows[0]);
  }

  // Get attempts by session
  static async getBySession(session_id: number): Promise<StudentAttempt[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM student_attempts WHERE session_id = ? ORDER BY attempted_at DESC',
      [session_id]
    );

    return rows.map(this.parseRow);
  }

  // Parse database row to StudentAttempt object
  private static parseRow(row: RowDataPacket): StudentAttempt {
    return {
      id: row.id,
      session_id: row.session_id,
      problem_id: row.problem_id,
      student_answer: row.student_answer,
      is_correct: row.is_correct,
      time_spent_seconds: row.time_spent_seconds,
      interaction_data: row.interaction_data
        ? JSON.parse(row.interaction_data)
        : undefined,
      attempted_at: row.attempted_at,
    };
  }
}
