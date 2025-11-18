import { Request, Response } from 'express';
import { ProblemModel } from '../models/problemModel';
import { logger } from '../config/logger';

export class ProblemController {
  /**
   * Get all problems
   */
  static async getAllProblems(req: Request, res: Response): Promise<void> {
    try {
      const { difficulty, type } = req.query;

      let problems;

      if (difficulty && typeof difficulty === 'string') {
        problems = ProblemModel.findByDifficulty(difficulty as 'easy' | 'medium' | 'hard');
      } else if (type && typeof type === 'string') {
        problems = ProblemModel.findByType(type);
      } else {
        problems = ProblemModel.findAll();
      }

      // Parse JSON fields and remove correct_answer from response
      const sanitizedProblems = problems.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        problem_type: p.problem_type,
        difficulty: p.difficulty,
        hints: p.hints ? JSON.parse(p.hints) : null,
        max_attempts: p.max_attempts,
        time_limit_seconds: p.time_limit_seconds,
        points: p.points,
        created_at: p.created_at
      }));

      res.status(200).json({
        success: true,
        data: sanitizedProblems
      });
    } catch (error) {
      logger.error('Error getting problems:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get problems'
      });
    }
  }

  /**
   * Get a single problem by ID
   */
  static async getProblem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const problem = ProblemModel.findById(id);
      if (!problem) {
        res.status(404).json({
          success: false,
          error: 'Problem not found'
        });
        return;
      }

      // Sanitize response (don't send correct answer or validation rules to client)
      const sanitizedProblem = {
        id: problem.id,
        title: problem.title,
        description: problem.description,
        problem_type: problem.problem_type,
        difficulty: problem.difficulty,
        hints: problem.hints ? JSON.parse(problem.hints) : null,
        max_attempts: problem.max_attempts,
        time_limit_seconds: problem.time_limit_seconds,
        points: problem.points,
        created_at: problem.created_at
      };

      res.status(200).json({
        success: true,
        data: sanitizedProblem
      });
    } catch (error) {
      logger.error('Error getting problem:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get problem'
      });
    }
  }
}
