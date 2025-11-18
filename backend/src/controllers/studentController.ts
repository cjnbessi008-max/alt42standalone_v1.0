import { Request, Response, NextFunction } from 'express';
import submissionModel from '../models/submissionModel';
import db from '../config/database';

export class StudentController {
  /**
   * Get student progress overview
   */
  async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;

      const result = await db.query(
        `SELECT
          problem_type,
          total_attempts,
          correct_attempts,
          accuracy_percentage,
          average_time_seconds,
          current_difficulty,
          last_activity_at
         FROM student_progress
         WHERE student_id = $1
         ORDER BY last_activity_at DESC`,
        [studentId]
      );

      res.json({
        status: 'success',
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get student submissions
   */
  async getSubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const { problem_id, limit, offset } = req.query;

      const submissions = await submissionModel.getByStudent(studentId, {
        problem_id: problem_id as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json({
        status: 'success',
        data: submissions,
        count: submissions.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get error patterns for a student
   */
  async getErrorPatterns(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;

      const result = await db.query(
        `SELECT
          problem_type,
          error_type,
          pattern_description,
          occurrences,
          first_seen,
          last_seen,
          is_resolved
         FROM error_patterns
         WHERE student_id = $1
         ORDER BY occurrences DESC, last_seen DESC`,
        [studentId]
      );

      res.json({
        status: 'success',
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;

      const stats = await submissionModel.getErrorStats(studentId);

      res.json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get student performance summary
   */
  async getPerformanceSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;

      const result = await db.query(
        `SELECT
          COUNT(DISTINCT problem_id) as problems_attempted,
          COUNT(*) as total_submissions,
          SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_submissions,
          ROUND(AVG(CASE WHEN is_correct THEN 100 ELSE 0 END), 2) as overall_accuracy,
          AVG(time_spent_seconds) as avg_time_per_problem,
          COUNT(DISTINCT DATE(submitted_at)) as days_active
         FROM submissions
         WHERE student_id = $1`,
        [studentId]
      );

      res.json({
        status: 'success',
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new StudentController();
