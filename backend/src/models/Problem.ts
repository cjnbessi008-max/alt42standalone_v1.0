import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Problem {
  id: number;
  title: string;
  description: string;
  inequality: string;
  moodle_id?: string;
  difficulty_level: number;
  created_at: Date;
  updated_at: Date;
}

export class ProblemModel {
  /**
   * Get all problems
   */
  static async getAll(): Promise<Problem[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM problems ORDER BY created_at DESC'
    );
    return rows as Problem[];
  }

  /**
   * Get problem by ID
   */
  static async getById(id: number): Promise<Problem | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM problems WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as Problem) : null;
  }

  /**
   * Get problem by Moodle ID
   */
  static async getByMoodleId(moodleId: string): Promise<Problem | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM problems WHERE moodle_id = ?',
      [moodleId]
    );
    return rows.length > 0 ? (rows[0] as Problem) : null;
  }

  /**
   * Create new problem
   */
  static async create(problem: Omit<Problem, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO problems (title, description, inequality, moodle_id, difficulty_level)
       VALUES (?, ?, ?, ?, ?)`,
      [problem.title, problem.description, problem.inequality, problem.moodle_id, problem.difficulty_level]
    );
    return result.insertId;
  }

  /**
   * Update problem
   */
  static async update(id: number, problem: Partial<Problem>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (problem.title !== undefined) {
      fields.push('title = ?');
      values.push(problem.title);
    }
    if (problem.description !== undefined) {
      fields.push('description = ?');
      values.push(problem.description);
    }
    if (problem.inequality !== undefined) {
      fields.push('inequality = ?');
      values.push(problem.inequality);
    }
    if (problem.difficulty_level !== undefined) {
      fields.push('difficulty_level = ?');
      values.push(problem.difficulty_level);
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = NOW()');
    values.push(id);

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE problems SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  /**
   * Delete problem
   */
  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM problems WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}
