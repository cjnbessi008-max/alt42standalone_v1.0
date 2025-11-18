import { query } from '../config/database';

export interface StudentProgress {
  id?: string;
  studentId: string;
  problemId: string;
  score: number;
  timeSpent: number;
  attempts: number;
  completedAt: Date;
}

export interface ProgressRow {
  id: string;
  student_id: string;
  problem_id: string;
  score: number;
  time_spent: number;
  attempts: number;
  completed_at: Date;
}

export class StudentProgressModel {
  static async create(progress: Omit<StudentProgress, 'id'>): Promise<StudentProgress> {
    const id = `prog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await query(
      `INSERT INTO student_progress
       (id, student_id, problem_id, score, time_spent, attempts, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        progress.studentId,
        progress.problemId,
        progress.score,
        progress.timeSpent,
        progress.attempts,
        progress.completedAt,
      ]
    );

    return {
      id,
      ...progress,
    };
  }

  static async findByStudent(studentId: string, limit = 20): Promise<StudentProgress[]> {
    const rows = await query(
      `SELECT * FROM student_progress
       WHERE student_id = ?
       ORDER BY completed_at DESC
       LIMIT ?`,
      [studentId, limit]
    ) as ProgressRow[];

    return rows.map((row) => ({
      id: row.id,
      studentId: row.student_id,
      problemId: row.problem_id,
      score: row.score,
      timeSpent: row.time_spent,
      attempts: row.attempts,
      completedAt: row.completed_at,
    }));
  }

  static async findByProblem(problemId: string): Promise<StudentProgress[]> {
    const rows = await query(
      'SELECT * FROM student_progress WHERE problem_id = ?',
      [problemId]
    ) as ProgressRow[];

    return rows.map((row) => ({
      id: row.id,
      studentId: row.student_id,
      problemId: row.problem_id,
      score: row.score,
      timeSpent: row.time_spent,
      attempts: row.attempts,
      completedAt: row.completed_at,
    }));
  }

  static async getStats(studentId: string): Promise<{
    totalProblems: number;
    averageScore: number;
    totalTimeSpent: number;
  }> {
    const rows = await query(
      `SELECT
        COUNT(*) as total_problems,
        AVG(score) as avg_score,
        SUM(time_spent) as total_time
       FROM student_progress
       WHERE student_id = ?`,
      [studentId]
    ) as any[];

    const row = rows[0];
    return {
      totalProblems: row.total_problems || 0,
      averageScore: row.avg_score || 0,
      totalTimeSpent: row.total_time || 0,
    };
  }
}
