import { query } from '../config/database';

export interface Problem {
  id: string;
  number: number;
  divisors: number[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
  createdAt?: Date;
}

export interface ProblemRow {
  id: string;
  number: number;
  divisors: string;
  difficulty: string;
  time_limit: number;
  created_at: Date;
}

export class ProblemModel {
  static async create(problem: Omit<Problem, 'id' | 'createdAt'>): Promise<Problem> {
    const id = `prob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const divisorsJson = JSON.stringify(problem.divisors);

    await query(
      `INSERT INTO problems (id, number, divisors, difficulty, time_limit)
       VALUES (?, ?, ?, ?, ?)`,
      [id, problem.number, divisorsJson, problem.difficulty, problem.timeLimit || 120]
    );

    return {
      id,
      ...problem,
    };
  }

  static async findById(id: string): Promise<Problem | null> {
    const rows = await query('SELECT * FROM problems WHERE id = ?', [id]) as ProblemRow[];

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      number: row.number,
      divisors: JSON.parse(row.divisors),
      difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
      timeLimit: row.time_limit,
      createdAt: row.created_at,
    };
  }

  static async findRandom(difficulty?: string): Promise<Problem | null> {
    const sql = difficulty
      ? 'SELECT * FROM problems WHERE difficulty = ? ORDER BY RAND() LIMIT 1'
      : 'SELECT * FROM problems ORDER BY RAND() LIMIT 1';

    const params = difficulty ? [difficulty] : [];
    const rows = await query(sql, params) as ProblemRow[];

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      number: row.number,
      divisors: JSON.parse(row.divisors),
      difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
      timeLimit: row.time_limit,
      createdAt: row.created_at,
    };
  }

  static async findAll(limit = 50): Promise<Problem[]> {
    const rows = await query(
      'SELECT * FROM problems ORDER BY created_at DESC LIMIT ?',
      [limit]
    ) as ProblemRow[];

    return rows.map((row) => ({
      id: row.id,
      number: row.number,
      divisors: JSON.parse(row.divisors),
      difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
      timeLimit: row.time_limit,
      createdAt: row.created_at,
    }));
  }
}
