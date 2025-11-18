import pool from '../config/database';
import { Problem, ProblemType, DifficultyLevel } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class ProblemModel {
  // Get all problems
  static async getAll(filters?: {
    problem_type?: ProblemType;
    difficulty_level?: DifficultyLevel;
    target_grade?: number;
    is_active?: boolean;
  }): Promise<Problem[]> {
    let query = 'SELECT * FROM problems WHERE 1=1';
    const params: any[] = [];

    if (filters) {
      if (filters.problem_type) {
        query += ' AND problem_type = ?';
        params.push(filters.problem_type);
      }
      if (filters.difficulty_level) {
        query += ' AND difficulty_level = ?';
        params.push(filters.difficulty_level);
      }
      if (filters.target_grade) {
        query += ' AND target_grade = ?';
        params.push(filters.target_grade);
      }
      if (filters.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(filters.is_active);
      }
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.map(this.parseRow);
  }

  // Get problem by ID
  static async getById(id: number): Promise<Problem | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM problems WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.parseRow(rows[0]);
  }

  // Get random problem
  static async getRandom(filters?: {
    problem_type?: ProblemType;
    difficulty_level?: DifficultyLevel;
    target_grade?: number;
  }): Promise<Problem | null> {
    let query = 'SELECT * FROM problems WHERE is_active = 1';
    const params: any[] = [];

    if (filters) {
      if (filters.problem_type) {
        query += ' AND problem_type = ?';
        params.push(filters.problem_type);
      }
      if (filters.difficulty_level) {
        query += ' AND difficulty_level = ?';
        params.push(filters.difficulty_level);
      }
      if (filters.target_grade) {
        query += ' AND target_grade = ?';
        params.push(filters.target_grade);
      }
    }

    query += ' ORDER BY RAND() LIMIT 1';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    if (rows.length === 0) {
      return null;
    }

    return this.parseRow(rows[0]);
  }

  // Create new problem
  static async create(problem: Problem): Promise<Problem> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO problems
       (moodle_problem_id, title, description, problem_type, difficulty_level,
        target_grade, numbers, correct_answer, visualization_config, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        problem.moodle_problem_id || null,
        problem.title,
        problem.description || null,
        problem.problem_type,
        problem.difficulty_level,
        problem.target_grade,
        JSON.stringify(problem.numbers),
        problem.correct_answer,
        problem.visualization_config
          ? JSON.stringify(problem.visualization_config)
          : null,
        problem.is_active !== undefined ? problem.is_active : true,
      ]
    );

    const created = await this.getById(result.insertId);
    if (!created) {
      throw new Error('Failed to create problem');
    }

    return created;
  }

  // Update problem
  static async update(id: number, problem: Partial<Problem>): Promise<Problem> {
    const updates: string[] = [];
    const params: any[] = [];

    if (problem.title !== undefined) {
      updates.push('title = ?');
      params.push(problem.title);
    }
    if (problem.description !== undefined) {
      updates.push('description = ?');
      params.push(problem.description);
    }
    if (problem.problem_type !== undefined) {
      updates.push('problem_type = ?');
      params.push(problem.problem_type);
    }
    if (problem.difficulty_level !== undefined) {
      updates.push('difficulty_level = ?');
      params.push(problem.difficulty_level);
    }
    if (problem.target_grade !== undefined) {
      updates.push('target_grade = ?');
      params.push(problem.target_grade);
    }
    if (problem.numbers !== undefined) {
      updates.push('numbers = ?');
      params.push(JSON.stringify(problem.numbers));
    }
    if (problem.correct_answer !== undefined) {
      updates.push('correct_answer = ?');
      params.push(problem.correct_answer);
    }
    if (problem.visualization_config !== undefined) {
      updates.push('visualization_config = ?');
      params.push(JSON.stringify(problem.visualization_config));
    }
    if (problem.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(problem.is_active);
    }

    if (updates.length === 0) {
      const existing = await this.getById(id);
      if (!existing) {
        throw new Error('Problem not found');
      }
      return existing;
    }

    params.push(id);

    await pool.execute(
      `UPDATE problems SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error('Failed to update problem');
    }

    return updated;
  }

  // Delete problem
  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM problems WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  // Parse database row to Problem object
  private static parseRow(row: RowDataPacket): Problem {
    return {
      id: row.id,
      moodle_problem_id: row.moodle_problem_id,
      title: row.title,
      description: row.description,
      problem_type: row.problem_type,
      difficulty_level: row.difficulty_level,
      target_grade: row.target_grade,
      numbers: JSON.parse(row.numbers),
      correct_answer: row.correct_answer,
      visualization_config: row.visualization_config
        ? JSON.parse(row.visualization_config)
        : undefined,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
