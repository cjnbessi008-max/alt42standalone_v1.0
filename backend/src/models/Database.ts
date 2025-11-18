import pg from 'pg';
import { Problem, Answer } from './Problem.js';

const { Pool } = pg;

export class Database {
  private pool: pg.Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'condition_doors',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
  }

  async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // 모든 문제 가져오기
  async getAllProblems(): Promise<Problem[]> {
    const result = await this.query('SELECT * FROM problems ORDER BY created_at DESC');
    return result.rows.map(this.mapRowToProblem);
  }

  // ID로 문제 가져오기
  async getProblemById(id: string): Promise<Problem | null> {
    const result = await this.query('SELECT * FROM problems WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this.mapRowToProblem(result.rows[0]);
  }

  // 랜덤 문제 가져오기
  async getRandomProblem(): Promise<Problem | null> {
    const result = await this.query(
      'SELECT * FROM problems ORDER BY RANDOM() LIMIT 1'
    );
    if (result.rows.length === 0) return null;
    return this.mapRowToProblem(result.rows[0]);
  }

  // 답안 저장
  async saveAnswer(answer: Answer): Promise<void> {
    await this.query(
      `INSERT INTO answers (problem_id, condition_type, is_correct, timestamp)
       VALUES ($1, $2, $3, $4)`,
      [answer.problemId, answer.conditionType, answer.isCorrect, answer.timestamp]
    );
  }

  // 통계 조회
  async getStatistics() {
    const totalResult = await this.query('SELECT COUNT(*) as total FROM answers');
    const correctResult = await this.query(
      'SELECT COUNT(*) as correct FROM answers WHERE is_correct = true'
    );

    return {
      total: parseInt(totalResult.rows[0].total),
      correct: parseInt(correctResult.rows[0].correct),
      accuracy:
        totalResult.rows[0].total > 0
          ? (parseInt(correctResult.rows[0].correct) / parseInt(totalResult.rows[0].total)) * 100
          : 0,
    };
  }

  // Row를 Problem 객체로 변환
  private mapRowToProblem(row: any): Problem {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      premise: row.premise,
      conclusion: row.conclusion,
      necessaryCondition: {
        id: `${row.id}-necessary`,
        type: 'necessary',
        statement: row.necessary_statement,
        isCorrect: row.necessary_is_correct,
      },
      sufficientCondition: {
        id: `${row.id}-sufficient`,
        type: 'sufficient',
        statement: row.sufficient_statement,
        isCorrect: row.sufficient_is_correct,
      },
      explanation: row.explanation,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async close() {
    await this.pool.end();
  }
}
