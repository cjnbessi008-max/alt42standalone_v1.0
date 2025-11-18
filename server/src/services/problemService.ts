import { pgPool } from '../config/database';
import { createError } from '../middleware/errorHandler';

interface Problem {
  id?: string;
  moodleQuestionId?: number;
  title: string;
  description?: string;
  problemData: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProblemService {
  /**
   * Create a new problem
   */
  async createProblem(data: Problem): Promise<Problem> {
    const client = await pgPool.connect();

    try {
      const result = await client.query(
        `INSERT INTO problems (moodle_question_id, title, description, problem_data)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [data.moodleQuestionId, data.title, data.description, JSON.stringify(data.problemData)]
      );

      return this.mapRow(result.rows[0]);
    } catch (error: any) {
      console.error('Error creating problem:', error);
      throw createError('Failed to create problem', 500, error.message);
    } finally {
      client.release();
    }
  }

  /**
   * Get problem by ID
   */
  async getProblemById(id: string): Promise<Problem | null> {
    const client = await pgPool.connect();

    try {
      const result = await client.query(
        'SELECT * FROM problems WHERE id = $1',
        [id]
      );

      return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
    } catch (error: any) {
      console.error('Error fetching problem:', error);
      throw createError('Failed to fetch problem', 500, error.message);
    } finally {
      client.release();
    }
  }

  /**
   * Get problem by Moodle question ID
   */
  async getProblemByMoodleId(moodleQuestionId: number): Promise<Problem | null> {
    const client = await pgPool.connect();

    try {
      const result = await client.query(
        'SELECT * FROM problems WHERE moodle_question_id = $1',
        [moodleQuestionId]
      );

      return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
    } catch (error: any) {
      console.error('Error fetching problem by Moodle ID:', error);
      throw createError('Failed to fetch problem', 500, error.message);
    } finally {
      client.release();
    }
  }

  /**
   * Update problem
   */
  async updateProblem(id: string, updates: Partial<Problem>): Promise<Problem> {
    const client = await pgPool.connect();

    try {
      const setParts: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.title !== undefined) {
        setParts.push(`title = $${paramIndex++}`);
        values.push(updates.title);
      }

      if (updates.description !== undefined) {
        setParts.push(`description = $${paramIndex++}`);
        values.push(updates.description);
      }

      if (updates.problemData !== undefined) {
        setParts.push(`problem_data = $${paramIndex++}`);
        values.push(JSON.stringify(updates.problemData));
      }

      setParts.push(`updated_at = CURRENT_TIMESTAMP`);

      values.push(id);

      const result = await client.query(
        `UPDATE problems SET ${setParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw createError('Problem not found', 404);
      }

      return this.mapRow(result.rows[0]);
    } catch (error: any) {
      console.error('Error updating problem:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete problem
   */
  async deleteProblem(id: string): Promise<void> {
    const client = await pgPool.connect();

    try {
      const result = await client.query(
        'DELETE FROM problems WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        throw createError('Problem not found', 404);
      }
    } catch (error: any) {
      console.error('Error deleting problem:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Map database row to Problem object
   */
  private mapRow(row: any): Problem {
    return {
      id: row.id,
      moodleQuestionId: row.moodle_question_id,
      title: row.title,
      description: row.description,
      problemData: row.problem_data,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
