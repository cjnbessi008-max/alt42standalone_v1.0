import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Student stats
  if (req.user.role === 'student') {
    const stats: any = await query(
      `SELECT
        COUNT(DISTINCT problem_id) as total_attempted,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as total_solved,
        AVG(score) as avg_score,
        SUM(time_spent) as total_time
      FROM attempts
      WHERE user_id = ?`,
      [req.user.id]
    );

    const recentActivity = await query(
      `SELECT
        a.*,
        p.title as problem_title
      FROM attempts a
      JOIN problems p ON a.problem_id = p.id
      WHERE a.user_id = ?
      ORDER BY a.submitted_at DESC
      LIMIT 5`,
      [req.user.id]
    );

    return res.json({
      stats: stats[0],
      recentActivity,
    });
  }

  // Teacher stats
  if (req.user.role === 'teacher' || req.user.role === 'admin') {
    const stats: any = await query(
      `SELECT
        COUNT(DISTINCT p.id) as total_problems,
        COUNT(DISTINCT a.user_id) as total_students,
        COUNT(a.id) as total_attempts,
        AVG(a.score) as avg_score
      FROM problems p
      LEFT JOIN attempts a ON p.id = a.problem_id
      WHERE p.created_by = ?`,
      [req.user.id]
    );

    const problemStats = await query(
      `SELECT
        p.id,
        p.title,
        p.difficulty,
        COUNT(a.id) as attempt_count,
        AVG(a.score) as avg_score
      FROM problems p
      LEFT JOIN attempts a ON p.id = a.problem_id
      WHERE p.created_by = ?
      GROUP BY p.id
      ORDER BY attempt_count DESC
      LIMIT 5`,
      [req.user.id]
    );

    return res.json({
      stats: stats[0],
      topProblems: problemStats,
    });
  }

  res.json({ stats: {} });
};
