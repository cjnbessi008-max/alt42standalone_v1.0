import pool from '../config/database.js';
import { Problem, ProblemRow, RowDataPacket } from '../types/index.js';

export class ProblemModel {
  // 모든 문제 조회
  static async findAll(): Promise<Problem[]> {
    const [rows] = await pool.query<ProblemRow[] & RowDataPacket[]>(
      'SELECT * FROM problems ORDER BY id ASC'
    );

    return rows.map(this.rowToProblem);
  }

  // ID로 문제 조회
  static async findById(id: number): Promise<Problem | null> {
    const [rows] = await pool.query<ProblemRow[] & RowDataPacket[]>(
      'SELECT * FROM problems WHERE id = ?',
      [id]
    );

    if (rows.length === 0) return null;

    return this.rowToProblem(rows[0]);
  }

  // 문제 생성
  static async create(problem: Omit<Problem, 'id'>): Promise<Problem> {
    const [result] = await pool.query(
      `INSERT INTO problems
       (title, description, available_functions, target_composition, test_cases, max_attempts, time_limit)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        problem.title,
        problem.description,
        JSON.stringify(problem.availableFunctions),
        problem.targetComposition,
        JSON.stringify(problem.testCases),
        problem.maxAttempts,
        problem.timeLimit || null,
      ]
    );

    const insertId = (result as any).insertId;
    const created = await this.findById(insertId);

    if (!created) throw new Error('Failed to create problem');

    return created;
  }

  // 문제 업데이트
  static async update(id: number, problem: Partial<Problem>): Promise<Problem | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (problem.title) {
      updates.push('title = ?');
      values.push(problem.title);
    }
    if (problem.description) {
      updates.push('description = ?');
      values.push(problem.description);
    }
    if (problem.availableFunctions) {
      updates.push('available_functions = ?');
      values.push(JSON.stringify(problem.availableFunctions));
    }
    if (problem.targetComposition) {
      updates.push('target_composition = ?');
      values.push(problem.targetComposition);
    }
    if (problem.testCases) {
      updates.push('test_cases = ?');
      values.push(JSON.stringify(problem.testCases));
    }
    if (problem.maxAttempts !== undefined) {
      updates.push('max_attempts = ?');
      values.push(problem.maxAttempts);
    }
    if (problem.timeLimit !== undefined) {
      updates.push('time_limit = ?');
      values.push(problem.timeLimit);
    }

    if (updates.length === 0) return this.findById(id);

    values.push(id);

    await pool.query(
      `UPDATE problems SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  // 문제 삭제
  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.query('DELETE FROM problems WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }

  // DB 행을 Problem 객체로 변환
  private static rowToProblem(row: ProblemRow): Problem {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      availableFunctions: JSON.parse(row.available_functions),
      targetComposition: row.target_composition,
      testCases: JSON.parse(row.test_cases),
      maxAttempts: row.max_attempts,
      timeLimit: row.time_limit || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
