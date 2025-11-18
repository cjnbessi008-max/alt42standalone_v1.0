import pool from '../config/database.js';
import { Attempt, AttemptRow, RowDataPacket } from '../types/index.js';

export class AttemptModel {
  // 모든 시도 조회
  static async findAll(): Promise<Attempt[]> {
    const [rows] = await pool.query<AttemptRow[] & RowDataPacket[]>(
      'SELECT * FROM student_attempts ORDER BY created_at DESC'
    );

    return rows.map(this.rowToAttempt);
  }

  // ID로 시도 조회
  static async findById(id: number): Promise<Attempt | null> {
    const [rows] = await pool.query<AttemptRow[] & RowDataPacket[]>(
      'SELECT * FROM student_attempts WHERE id = ?',
      [id]
    );

    if (rows.length === 0) return null;

    return this.rowToAttempt(rows[0]);
  }

  // 학생 ID로 시도 조회
  static async findByStudentId(studentId: string): Promise<Attempt[]> {
    const [rows] = await pool.query<AttemptRow[] & RowDataPacket[]>(
      'SELECT * FROM student_attempts WHERE student_id = ? ORDER BY created_at DESC',
      [studentId]
    );

    return rows.map(this.rowToAttempt);
  }

  // 문제 ID로 시도 조회
  static async findByProblemId(problemId: number): Promise<Attempt[]> {
    const [rows] = await pool.query<AttemptRow[] & RowDataPacket[]>(
      'SELECT * FROM student_attempts WHERE problem_id = ? ORDER BY created_at DESC',
      [problemId]
    );

    return rows.map(this.rowToAttempt);
  }

  // 특정 학생의 특정 문제 시도 조회
  static async findByStudentAndProblem(studentId: string, problemId: number): Promise<Attempt[]> {
    const [rows] = await pool.query<AttemptRow[] & RowDataPacket[]>(
      'SELECT * FROM student_attempts WHERE student_id = ? AND problem_id = ? ORDER BY created_at DESC',
      [studentId, problemId]
    );

    return rows.map(this.rowToAttempt);
  }

  // 시도 생성
  static async create(attempt: Omit<Attempt, 'id'>): Promise<Attempt> {
    const [result] = await pool.query(
      `INSERT INTO student_attempts
       (problem_id, student_id, student_name, composition, result)
       VALUES (?, ?, ?, ?, ?)`,
      [
        attempt.problemId,
        attempt.studentId,
        attempt.studentName || null,
        JSON.stringify(attempt.composition),
        JSON.stringify(attempt.result),
      ]
    );

    const insertId = (result as any).insertId;
    const created = await this.findById(insertId);

    if (!created) throw new Error('Failed to create attempt');

    return created;
  }

  // 통계 조회
  static async getStatistics(problemId?: number, studentId?: string) {
    let query = `
      SELECT
        COUNT(*) as total_attempts,
        SUM(CASE WHEN JSON_EXTRACT(result, '$.success') = true THEN 1 ELSE 0 END) as successful_attempts,
        AVG(JSON_EXTRACT(result, '$.score')) as average_score
      FROM student_attempts
      WHERE 1=1
    `;

    const params: any[] = [];

    if (problemId !== undefined) {
      query += ' AND problem_id = ?';
      params.push(problemId);
    }

    if (studentId !== undefined) {
      query += ' AND student_id = ?';
      params.push(studentId);
    }

    const [rows] = await pool.query<any[]>(query, params);

    return rows[0];
  }

  // DB 행을 Attempt 객체로 변환
  private static rowToAttempt(row: AttemptRow): Attempt {
    return {
      id: row.id,
      problemId: row.problem_id,
      studentId: row.student_id,
      studentName: row.student_name || undefined,
      composition: JSON.parse(row.composition),
      result: JSON.parse(row.result),
      timestamp: row.created_at,
    };
  }
}
