import db from '../config/database';
import { Problem, CreateProblemRequest, DifficultyLevel, ProblemType } from '../types';
import { NotFoundError } from '../utils/errors';

export class ProblemModel {
  /**
   * Get all active problems
   */
  async getAll(filters?: {
    type?: ProblemType;
    difficulty?: DifficultyLevel;
    limit?: number;
    offset?: number;
  }): Promise<Problem[]> {
    let query = `
      SELECT * FROM problems
      WHERE is_active = true
    `;
    const params: unknown[] = [];
    let paramCount = 0;

    if (filters?.type) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(filters.type);
    }

    if (filters?.difficulty) {
      paramCount++;
      query += ` AND difficulty = $${paramCount}`;
      params.push(filters.difficulty);
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    if (filters?.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get problem by ID
   */
  async getById(id: string): Promise<Problem> {
    const result = await db.query('SELECT * FROM problems WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError(`Problem with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Create a new problem
   */
  async create(data: CreateProblemRequest, createdBy?: string): Promise<Problem> {
    const result = await db.query(
      `INSERT INTO problems (created_by, type, difficulty, problem_data, correct_answer, visual_type, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        createdBy || null,
        data.type,
        data.difficulty,
        JSON.stringify(data.problem_data),
        JSON.stringify(data.correct_answer),
        data.visual_type || null,
        data.tags || [],
      ]
    );

    return result.rows[0];
  }

  /**
   * Update a problem
   */
  async update(id: string, data: Partial<CreateProblemRequest>): Promise<Problem> {
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramCount = 0;

    if (data.difficulty) {
      paramCount++;
      updates.push(`difficulty = $${paramCount}`);
      params.push(data.difficulty);
    }

    if (data.problem_data) {
      paramCount++;
      updates.push(`problem_data = $${paramCount}`);
      params.push(JSON.stringify(data.problem_data));
    }

    if (data.correct_answer) {
      paramCount++;
      updates.push(`correct_answer = $${paramCount}`);
      params.push(JSON.stringify(data.correct_answer));
    }

    if (data.visual_type) {
      paramCount++;
      updates.push(`visual_type = $${paramCount}`);
      params.push(data.visual_type);
    }

    if (data.tags) {
      paramCount++;
      updates.push(`tags = $${paramCount}`);
      params.push(data.tags);
    }

    if (updates.length === 0) {
      return this.getById(id);
    }

    paramCount++;
    params.push(id);

    const result = await db.query(
      `UPDATE problems SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`Problem with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Soft delete a problem
   */
  async delete(id: string): Promise<void> {
    const result = await db.query(
      'UPDATE problems SET is_active = false WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`Problem with ID ${id} not found`);
    }
  }

  /**
   * Get random problem by type and difficulty
   */
  async getRandom(type?: ProblemType, difficulty?: DifficultyLevel): Promise<Problem> {
    let query = `
      SELECT * FROM problems
      WHERE is_active = true
    `;
    const params: unknown[] = [];

    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }

    if (difficulty) {
      params.push(difficulty);
      query += ` AND difficulty = $${params.length}`;
    }

    query += ' ORDER BY RANDOM() LIMIT 1';

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      throw new NotFoundError('No problems found matching the criteria');
    }

    return result.rows[0];
  }
}

export default new ProblemModel();
