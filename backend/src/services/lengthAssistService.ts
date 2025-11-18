// Length Assist Service Layer

import { query } from '../config/database.js';
import { LengthAssistProblem, StudentAttempt, StudentProgress } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class LengthAssistService {
  /**
   * Get all problems for a module
   */
  async getProblems(moduleId: string, difficulty?: number, limit: number = 10, offset: number = 0) {
    let sql = `
      SELECT
        id, module_id, title, description, geometry_data,
        target_ratio, tolerance, hints, difficulty, unit,
        created_at, updated_at
      FROM length_assist_problems
      WHERE module_id = $1
    `;
    const params: any[] = [moduleId];

    if (difficulty) {
      sql += ` AND difficulty = $${params.length + 1}`;
      params.push(difficulty);
    }

    sql += ` ORDER BY difficulty, created_at LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows.map(this.formatProblem);
  }

  /**
   * Get a specific problem by ID
   */
  async getProblem(problemId: string): Promise<LengthAssistProblem | null> {
    const result = await query(
      `SELECT * FROM length_assist_problems WHERE id = $1`,
      [problemId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.formatProblem(result.rows[0]);
  }

  /**
   * Get next problem for student based on their progress
   */
  async getNextProblem(studentId: string, moduleId: string): Promise<LengthAssistProblem | null> {
    // Get student's current level
    const progressResult = await query(
      `SELECT accuracy_rate FROM student_progress WHERE student_id = $1 AND module_id = $2`,
      [studentId, moduleId]
    );

    let difficulty = 1;
    if (progressResult.rows.length > 0) {
      const accuracyRate = progressResult.rows[0].accuracy_rate;
      if (accuracyRate >= 80) difficulty = 3;
      else if (accuracyRate >= 60) difficulty = 2;
    }

    // Get unsolved problems at appropriate difficulty
    const result = await query(
      `
      SELECT p.* FROM length_assist_problems p
      WHERE p.module_id = $1
      AND p.difficulty <= $2
      AND NOT EXISTS (
        SELECT 1 FROM student_attempts a
        WHERE a.problem_id = p.id
        AND a.student_id = $3
        AND a.is_correct = true
      )
      ORDER BY p.difficulty, RANDOM()
      LIMIT 1
      `,
      [moduleId, difficulty, studentId]
    );

    if (result.rows.length === 0) {
      // If no unsolved problems, get a random problem
      const fallbackResult = await query(
        `SELECT * FROM length_assist_problems WHERE module_id = $1 ORDER BY RANDOM() LIMIT 1`,
        [moduleId]
      );
      return fallbackResult.rows.length > 0 ? this.formatProblem(fallbackResult.rows[0]) : null;
    }

    return this.formatProblem(result.rows[0]);
  }

  /**
   * Submit student answer
   */
  async submitAnswer(
    problemId: string,
    studentId: string,
    measuredRatio: number,
    line1Length: number,
    line2Length: number,
    timeSpent: number,
    interactions: any[]
  ) {
    // Get problem to check correct answer
    const problem = await this.getProblem(problemId);
    if (!problem) {
      throw new Error('Problem not found');
    }

    // Check if answer is correct (within tolerance)
    const isCorrect = Math.abs(measuredRatio - problem.targetRatio) <= problem.tolerance;

    // Insert attempt
    const attemptId = uuidv4();
    await query(
      `
      INSERT INTO student_attempts
      (id, problem_id, student_id, measured_ratio, line1_length, line2_length, is_correct, time_spent, interactions)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [attemptId, problemId, studentId, measuredRatio, line1Length, line2Length, isCorrect, timeSpent, JSON.stringify(interactions)]
    );

    // Update student progress
    await this.updateProgress(studentId, problem.moduleId);

    // Generate feedback
    let feedback = '';
    if (isCorrect) {
      feedback = `정답입니다! 비율 ${problem.targetRatio.toFixed(2)}에 매우 가깝습니다.`;
    } else {
      const diff = Math.abs(measuredRatio - problem.targetRatio);
      if (diff <= problem.tolerance * 2) {
        feedback = `아쉽습니다! 조금만 더 조절하면 정답입니다. (목표: ${problem.targetRatio.toFixed(2)})`;
      } else {
        feedback = `다시 시도해보세요. 목표 비율은 ${problem.targetRatio.toFixed(2)}입니다.`;
      }
    }

    return {
      isCorrect,
      feedback,
      correctRatio: problem.targetRatio,
      score: isCorrect ? 100 : Math.max(0, 100 - Math.floor(diff / problem.tolerance * 20)),
    };
  }

  /**
   * Update student progress
   */
  private async updateProgress(studentId: string, moduleId: string) {
    // Get all attempts for this module
    const attemptsResult = await query(
      `
      SELECT COUNT(*) as total, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct, AVG(time_spent) as avg_time
      FROM student_attempts a
      JOIN length_assist_problems p ON a.problem_id = p.id
      WHERE a.student_id = $1 AND p.module_id = $2
      `,
      [studentId, moduleId]
    );

    const stats = attemptsResult.rows[0];
    const accuracyRate = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;

    // Get unique problems completed
    const completedResult = await query(
      `
      SELECT COUNT(DISTINCT problem_id) as completed
      FROM student_attempts
      WHERE student_id = $1 AND is_correct = true
      AND problem_id IN (SELECT id FROM length_assist_problems WHERE module_id = $2)
      `,
      [studentId, moduleId]
    );

    const totalResult = await query(
      `SELECT COUNT(*) as total FROM length_assist_problems WHERE module_id = $1`,
      [moduleId]
    );

    await query(
      `
      INSERT INTO student_progress (student_id, module_id, problems_completed, total_problems, accuracy_rate, average_time_per_problem, last_activity_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (student_id, module_id)
      DO UPDATE SET
        problems_completed = $3,
        total_problems = $4,
        accuracy_rate = $5,
        average_time_per_problem = $6,
        last_activity_at = CURRENT_TIMESTAMP
      `,
      [
        studentId,
        moduleId,
        completedResult.rows[0].completed || 0,
        totalResult.rows[0].total || 0,
        accuracyRate,
        Math.floor(stats.avg_time || 0),
      ]
    );
  }

  /**
   * Get student progress
   */
  async getProgress(studentId: string, moduleId: string): Promise<StudentProgress | null> {
    const result = await query(
      `SELECT * FROM student_progress WHERE student_id = $1 AND module_id = $2`,
      [studentId, moduleId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      studentId: row.student_id,
      moduleId: row.module_id,
      problemsCompleted: row.problems_completed,
      totalProblems: row.total_problems,
      accuracyRate: parseFloat(row.accuracy_rate),
      averageTimePerProblem: row.average_time_per_problem,
      lastActivityAt: row.last_activity_at,
    };
  }

  /**
   * Format problem data
   */
  private formatProblem(row: any): LengthAssistProblem {
    const geometryData = row.geometry_data;
    return {
      id: row.id,
      moduleId: row.module_id,
      title: row.title,
      description: row.description,
      shapes: geometryData.shapes || [],
      lines: geometryData.lines || [],
      targetRatio: parseFloat(row.target_ratio),
      tolerance: parseFloat(row.tolerance),
      hints: row.hints || [],
      difficulty: row.difficulty,
      unit: row.unit,
      createdAt: row.created_at,
    };
  }
}

export default new LengthAssistService();
