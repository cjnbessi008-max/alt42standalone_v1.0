import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

/**
 * Get all users (admin only)
 */
export const getUsers = async (req: AuthRequest, res: Response) => {
  const { role, search, limit = 20, offset = 0 } = req.query;

  let sql = 'SELECT id, email, name, role, created_at, last_login FROM users WHERE 1=1';
  const params: any[] = [];

  if (role) {
    sql += ' AND role = ?';
    params.push(role);
  }

  if (search) {
    sql += ' AND (name LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const users = await query(sql, params);

  res.json({ users });
};

/**
 * Get leaderboard
 */
export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  const { limit = 10 } = req.query;

  const leaderboard = await query(
    `SELECT
      u.id,
      u.name,
      COUNT(DISTINCT a.problem_id) as problems_solved,
      AVG(a.score) as average_score,
      SUM(a.time_spent) as total_time
    FROM users u
    LEFT JOIN attempts a ON u.id = a.user_id AND a.is_correct = 1
    WHERE u.role = 'student'
    GROUP BY u.id, u.name
    HAVING problems_solved > 0
    ORDER BY problems_solved DESC, average_score DESC
    LIMIT ?`,
    [Number(limit)]
  );

  res.json({ leaderboard });
};
