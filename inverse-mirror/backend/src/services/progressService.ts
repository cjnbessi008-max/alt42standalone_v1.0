import { query } from '../config/database.js';
import { StudentProgress } from '../models/Problem.js';
import moodleService from './moodleService.js';

export class ProgressService {
  /**
   * Save student progress
   */
  async saveProgress(progress: StudentProgress): Promise<number> {
    try {
      const result: any = await query(
        `INSERT INTO student_progress
         (student_id, problem_id, attempts, completed, score, time_spent)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         attempts = attempts + 1,
         completed = VALUES(completed),
         score = VALUES(score),
         time_spent = time_spent + VALUES(time_spent),
         updated_at = CURRENT_TIMESTAMP`,
        [
          progress.studentId,
          progress.problemId,
          progress.attempts,
          progress.completed,
          progress.score,
          progress.timeSpent,
        ]
      );

      // Submit grade to Moodle if completed
      if (progress.completed && progress.score > 0) {
        await moodleService.submitGrade(
          progress.studentId,
          progress.problemId,
          progress.score
        );
      }

      return result.insertId || result.affectedRows;
    } catch (error) {
      console.error('Error saving progress:', error);
      throw error;
    }
  }

  /**
   * Get student progress by student ID
   */
  async getProgressByStudent(studentId: number): Promise<StudentProgress[]> {
    try {
      const result: any = await query(
        'SELECT * FROM student_progress WHERE student_id = ? ORDER BY updated_at DESC',
        [studentId]
      );

      return result.map((row: any) => ({
        id: row.id,
        studentId: row.student_id,
        problemId: row.problem_id,
        attempts: row.attempts,
        completed: row.completed === 1,
        score: row.score,
        timeSpent: row.time_spent,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      console.error('Error getting progress:', error);
      return [];
    }
  }

  /**
   * Get progress for specific problem
   */
  async getProgressByProblem(studentId: number, problemId: number): Promise<StudentProgress | null> {
    try {
      const result: any = await query(
        'SELECT * FROM student_progress WHERE student_id = ? AND problem_id = ?',
        [studentId, problemId]
      );

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      return {
        id: row.id,
        studentId: row.student_id,
        problemId: row.problem_id,
        attempts: row.attempts,
        completed: row.completed === 1,
        score: row.score,
        timeSpent: row.time_spent,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error('Error getting progress:', error);
      return null;
    }
  }

  /**
   * Get statistics for a student
   */
  async getStudentStats(studentId: number): Promise<any> {
    try {
      const result: any = await query(
        `SELECT
          COUNT(*) as total_problems,
          SUM(completed) as completed_problems,
          AVG(score) as average_score,
          SUM(time_spent) as total_time,
          SUM(attempts) as total_attempts
         FROM student_progress
         WHERE student_id = ?`,
        [studentId]
      );

      return result[0] || {
        total_problems: 0,
        completed_problems: 0,
        average_score: 0,
        total_time: 0,
        total_attempts: 0,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }
}

export default new ProgressService();
