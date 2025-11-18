/**
 * Student Model - Data Access Layer
 */

import { query } from '../config/database';
import {
  Student,
  Attempt,
  PerformanceMetrics,
  DifficultyLevel,
  DifficultyAdjustment,
} from '../../../shared/types';

export class StudentModel {
  /**
   * Get student by ID
   */
  static async findById(id: string): Promise<Student | null> {
    const result = await query<any>(
      `SELECT u.*, s.current_difficulty, s.total_problems_attempted,
              s.total_correct, s.average_solve_time, s.performance_score
       FROM users u
       JOIN students s ON u.id = s.id
       WHERE u.id = $1 AND u.role = 'student'`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return this.mapToStudent(row);
  }

  /**
   * Get student by email
   */
  static async findByEmail(email: string): Promise<Student | null> {
    const result = await query<any>(
      `SELECT u.*, s.current_difficulty, s.total_problems_attempted,
              s.total_correct, s.average_solve_time, s.performance_score
       FROM users u
       JOIN students s ON u.id = s.id
       WHERE u.email = $1 AND u.role = 'student'`,
      [email]
    );

    if (result.rows.length === 0) return null;
    return this.mapToStudent(result.rows[0]);
  }

  /**
   * Get all students
   */
  static async findAll(): Promise<Student[]> {
    const result = await query<any>(
      `SELECT u.*, s.current_difficulty, s.total_problems_attempted,
              s.total_correct, s.average_solve_time, s.performance_score
       FROM users u
       JOIN students s ON u.id = s.id
       WHERE u.role = 'student'
       ORDER BY u.name`
    );

    return result.rows.map(row => this.mapToStudent(row));
  }

  /**
   * Update student's current difficulty
   */
  static async updateDifficulty(studentId: string, newDifficulty: DifficultyLevel): Promise<void> {
    await query(
      `UPDATE students
       SET current_difficulty = $1
       WHERE id = $2`,
      [newDifficulty, studentId]
    );
  }

  /**
   * Update student performance metrics
   */
  static async updatePerformanceMetrics(
    studentId: string,
    totalAttempted: number,
    totalCorrect: number,
    avgSolveTime: number,
    performanceScore: number
  ): Promise<void> {
    await query(
      `UPDATE students
       SET total_problems_attempted = $1,
           total_correct = $2,
           average_solve_time = $3,
           performance_score = $4,
           last_activity_at = NOW()
       WHERE id = $5`,
      [totalAttempted, totalCorrect, avgSolveTime, performanceScore, studentId]
    );
  }

  /**
   * Get student's recent attempts
   */
  static async getRecentAttempts(
    studentId: string,
    limit: number = 10
  ): Promise<Attempt[]> {
    const result = await query<any>(
      `SELECT * FROM attempts
       WHERE student_id = $1
       ORDER BY attempted_at DESC
       LIMIT $2`,
      [studentId, limit]
    );

    return result.rows.map(row => this.mapToAttempt(row));
  }

  /**
   * Get all student attempts
   */
  static async getAllAttempts(studentId: string): Promise<Attempt[]> {
    const result = await query<any>(
      `SELECT * FROM attempts
       WHERE student_id = $1
       ORDER BY attempted_at DESC`,
      [studentId]
    );

    return result.rows.map(row => this.mapToAttempt(row));
  }

  /**
   * Record a new attempt
   */
  static async recordAttempt(
    studentId: string,
    problemId: string,
    answer: string,
    isCorrect: boolean,
    timeSpent: number,
    currentDifficulty: DifficultyLevel
  ): Promise<Attempt> {
    const result = await query<any>(
      `INSERT INTO attempts (student_id, problem_id, answer, is_correct, time_spent, difficulty_at_attempt)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [studentId, problemId, answer, isCorrect, timeSpent, currentDifficulty]
    );

    return this.mapToAttempt(result.rows[0]);
  }

  /**
   * Record difficulty adjustment
   */
  static async recordDifficultyAdjustment(
    studentId: string,
    adjustment: DifficultyAdjustment
  ): Promise<void> {
    await query(
      `INSERT INTO difficulty_adjustments
       (student_id, previous_difficulty, new_difficulty, reason, metrics)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        studentId,
        adjustment.previousDifficulty,
        adjustment.newDifficulty,
        adjustment.reason,
        JSON.stringify(adjustment.metrics),
      ]
    );
  }

  /**
   * Get difficulty adjustment history
   */
  static async getDifficultyHistory(
    studentId: string,
    limit: number = 10
  ): Promise<DifficultyAdjustment[]> {
    const result = await query<any>(
      `SELECT * FROM difficulty_adjustments
       WHERE student_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [studentId, limit]
    );

    return result.rows.map(row => ({
      previousDifficulty: row.previous_difficulty,
      newDifficulty: row.new_difficulty,
      reason: row.reason,
      metrics: row.metrics,
      timestamp: new Date(row.created_at),
    }));
  }

  /**
   * Get performance metrics
   */
  static async getPerformanceMetrics(studentId: string): Promise<PerformanceMetrics | null> {
    const result = await query<any>(
      `SELECT * FROM performance_metrics
       WHERE student_id = $1`,
      [studentId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const student = await this.findById(studentId);
    if (!student) return null;

    return {
      studentId,
      currentDifficulty: student.currentDifficulty,
      recommendedDifficulty: student.currentDifficulty,
      averageSolveTime: student.averageSolveTime,
      averageSolveTimeByDifficulty: row.average_solve_time_by_difficulty || {},
      accuracyRate: row.accuracy_rate,
      accuracyByDifficulty: row.accuracy_by_difficulty || {},
      recentPerformanceTrend: row.recent_performance_trend || 'stable',
      totalProblems: row.total_problems,
      lastAttemptAt: row.last_calculated_at ? new Date(row.last_calculated_at) : undefined,
    };
  }

  /**
   * Update cached performance metrics
   */
  static async updatePerformanceMetricsCache(
    studentId: string,
    metrics: Partial<PerformanceMetrics>
  ): Promise<void> {
    await query(
      `INSERT INTO performance_metrics
       (student_id, accuracy_rate, accuracy_by_difficulty, average_solve_time_by_difficulty,
        recent_performance_trend, total_problems, last_calculated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (student_id)
       DO UPDATE SET
         accuracy_rate = EXCLUDED.accuracy_rate,
         accuracy_by_difficulty = EXCLUDED.accuracy_by_difficulty,
         average_solve_time_by_difficulty = EXCLUDED.average_solve_time_by_difficulty,
         recent_performance_trend = EXCLUDED.recent_performance_trend,
         total_problems = EXCLUDED.total_problems,
         last_calculated_at = NOW()`,
      [
        studentId,
        metrics.accuracyRate || 0,
        JSON.stringify(metrics.accuracyByDifficulty || {}),
        JSON.stringify(metrics.averageSolveTimeByDifficulty || {}),
        metrics.recentPerformanceTrend || 'stable',
        metrics.totalProblems || 0,
      ]
    );
  }

  // Helper mapping functions
  private static mapToStudent(row: any): Student {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: 'student',
      currentDifficulty: row.current_difficulty,
      totalProblemsAttempted: row.total_problems_attempted,
      totalCorrect: row.total_correct,
      averageSolveTime: parseFloat(row.average_solve_time) || 0,
      performanceScore: parseFloat(row.performance_score) || 50,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private static mapToAttempt(row: any): Attempt {
    return {
      id: row.id,
      studentId: row.student_id,
      problemId: row.problem_id,
      answer: row.answer,
      isCorrect: row.is_correct,
      timeSpent: row.time_spent,
      difficultyAtAttempt: row.difficulty_at_attempt,
      attemptedAt: new Date(row.attempted_at),
    };
  }
}

export default StudentModel;
