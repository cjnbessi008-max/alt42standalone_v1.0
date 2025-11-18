/**
 * Problem Model - Data Access Layer
 */

import { query } from '../config/database';
import { Problem, DifficultyLevel, ProblemType } from '../../../shared/types';

export class ProblemModel {
  /**
   * Get problem by ID
   */
  static async findById(id: string): Promise<Problem | null> {
    const result = await query<any>(
      `SELECT * FROM problems WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;
    return this.mapToProblem(result.rows[0]);
  }

  /**
   * Get random problem by difficulty
   */
  static async getRandomByDifficulty(
    difficulty: DifficultyLevel,
    excludeIds: string[] = []
  ): Promise<Problem | null> {
    const excludeClause = excludeIds.length > 0
      ? `AND id NOT IN (${excludeIds.map((_, i) => `$${i + 2}`).join(', ')})`
      : '';

    const result = await query<any>(
      `SELECT * FROM problems
       WHERE difficulty = $1 ${excludeClause}
       ORDER BY RANDOM()
       LIMIT 1`,
      [difficulty, ...excludeIds]
    );

    if (result.rows.length === 0) return null;
    return this.mapToProblem(result.rows[0]);
  }

  /**
   * Get all problems by difficulty
   */
  static async findByDifficulty(difficulty: DifficultyLevel): Promise<Problem[]> {
    const result = await query<any>(
      `SELECT * FROM problems
       WHERE difficulty = $1
       ORDER BY created_at DESC`,
      [difficulty]
    );

    return result.rows.map(row => this.mapToProblem(row));
  }

  /**
   * Get all problems
   */
  static async findAll(): Promise<Problem[]> {
    const result = await query<any>(
      `SELECT * FROM problems
       ORDER BY difficulty, created_at DESC`
    );

    return result.rows.map(row => this.mapToProblem(row));
  }

  /**
   * Create new problem
   */
  static async create(problem: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>): Promise<Problem> {
    const result = await query<any>(
      `INSERT INTO problems
       (title, description, type, difficulty, time_limit, correct_answer, options, hints, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        problem.title,
        problem.description,
        problem.type,
        problem.difficulty,
        problem.timeLimit || null,
        problem.correctAnswer,
        JSON.stringify(problem.options || []),
        JSON.stringify(problem.hints || []),
        JSON.stringify(problem.tags || []),
      ]
    );

    return this.mapToProblem(result.rows[0]);
  }

  /**
   * Update problem
   */
  static async update(id: string, updates: Partial<Problem>): Promise<Problem | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.difficulty !== undefined) {
      fields.push(`difficulty = $${paramCount++}`);
      values.push(updates.difficulty);
    }
    if (updates.correctAnswer !== undefined) {
      fields.push(`correct_answer = $${paramCount++}`);
      values.push(updates.correctAnswer);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await query<any>(
      `UPDATE problems
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) return null;
    return this.mapToProblem(result.rows[0]);
  }

  /**
   * Delete problem
   */
  static async delete(id: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM problems WHERE id = $1`,
      [id]
    );
    return (result.rowCount || 0) > 0;
  }

  /**
   * Get problem count by difficulty
   */
  static async countByDifficulty(): Promise<Record<DifficultyLevel, number>> {
    const result = await query<any>(
      `SELECT difficulty, COUNT(*) as count
       FROM problems
       GROUP BY difficulty`
    );

    const counts: Record<DifficultyLevel, number> = {
      [DifficultyLevel.VERY_EASY]: 0,
      [DifficultyLevel.EASY]: 0,
      [DifficultyLevel.MEDIUM]: 0,
      [DifficultyLevel.HARD]: 0,
      [DifficultyLevel.VERY_HARD]: 0,
    };

    result.rows.forEach(row => {
      counts[row.difficulty as DifficultyLevel] = parseInt(row.count);
    });

    return counts;
  }

  /**
   * Search problems by tags
   */
  static async findByTags(tags: string[]): Promise<Problem[]> {
    const result = await query<any>(
      `SELECT * FROM problems
       WHERE tags ?| $1
       ORDER BY created_at DESC`,
      [tags]
    );

    return result.rows.map(row => this.mapToProblem(row));
  }

  // Helper mapping function
  private static mapToProblem(row: any): Problem {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type as ProblemType,
      difficulty: row.difficulty as DifficultyLevel,
      timeLimit: row.time_limit,
      correctAnswer: row.correct_answer,
      options: row.options || [],
      hints: row.hints || [],
      tags: row.tags || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export default ProblemModel;
