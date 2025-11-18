import { db } from '../config/database';
import { Problem } from '../types';
import { logger } from '../config/logger';

export class ProblemModel {
  /**
   * Find problem by ID
   */
  static findById(id: string): Problem | null {
    try {
      const problem = db.prepare(
        'SELECT * FROM problems WHERE id = ?'
      ).get(id) as Problem | undefined;

      return problem || null;
    } catch (error) {
      logger.error('Failed to find problem:', error);
      throw error;
    }
  }

  /**
   * Get all problems
   */
  static findAll(): Problem[] {
    try {
      const problems = db.prepare(
        'SELECT * FROM problems ORDER BY created_at DESC'
      ).all() as Problem[];

      return problems;
    } catch (error) {
      logger.error('Failed to find all problems:', error);
      throw error;
    }
  }

  /**
   * Get problems by difficulty
   */
  static findByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Problem[] {
    try {
      const problems = db.prepare(
        'SELECT * FROM problems WHERE difficulty = ? ORDER BY created_at DESC'
      ).all(difficulty) as Problem[];

      return problems;
    } catch (error) {
      logger.error('Failed to find problems by difficulty:', error);
      throw error;
    }
  }

  /**
   * Get problems by type
   */
  static findByType(type: string): Problem[] {
    try {
      const problems = db.prepare(
        'SELECT * FROM problems WHERE problem_type = ? ORDER BY created_at DESC'
      ).all(type) as Problem[];

      return problems;
    } catch (error) {
      logger.error('Failed to find problems by type:', error);
      throw error;
    }
  }
}
