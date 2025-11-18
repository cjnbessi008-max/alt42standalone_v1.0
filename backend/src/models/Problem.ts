import pool from '../config/database';
import { Problem, ProblemWithHints, Hint } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class ProblemModel {
  static async getAll(filters?: {
    difficulty?: number;
    category?: string;
    isActive?: boolean;
  }): Promise<Problem[]> {
    let query = 'SELECT * FROM problems WHERE 1=1';
    const params: any[] = [];

    if (filters?.difficulty) {
      query += ' AND difficulty_level = ?';
      params.push(filters.difficulty);
    }

    if (filters?.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters?.isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.isActive);
    }

    query += ' ORDER BY difficulty_level ASC, id ASC';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows as Problem[];
  }

  static async getById(id: number): Promise<Problem | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM problems WHERE id = ?',
      [id]
    );

    if (rows.length === 0) return null;
    return rows[0] as Problem;
  }

  static async getWithHints(id: number): Promise<ProblemWithHints | null> {
    const problem = await this.getById(id);
    if (!problem) return null;

    const [hints] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM hints WHERE problem_id = ? ORDER BY hint_order ASC',
      [id]
    );

    return {
      ...problem,
      hints: hints as Hint[],
    };
  }

  static async create(problemData: Omit<Problem, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO problems
       (title, equation_left, equation_right, solution, difficulty_level,
        category, max_steps, time_limit, created_by, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        problemData.title,
        problemData.equation_left,
        problemData.equation_right,
        problemData.solution,
        problemData.difficulty_level,
        problemData.category,
        problemData.max_steps,
        problemData.time_limit,
        problemData.created_by,
        problemData.is_active,
      ]
    );

    return result.insertId;
  }

  static async update(id: number, problemData: Partial<Problem>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(problemData).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE problems SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM problems WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  static async getByDifficulty(level: number): Promise<Problem[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM problems WHERE difficulty_level = ? AND is_active = TRUE ORDER BY id ASC',
      [level]
    );

    return rows as Problem[];
  }
}
