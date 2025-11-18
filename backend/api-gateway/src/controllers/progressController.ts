import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getProgress = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  // Get or create progress stats
  let result = await query(
    'SELECT * FROM progress_stats WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    // Create initial progress stats
    await query(
      'INSERT INTO progress_stats (user_id) VALUES ($1)',
      [userId]
    );

    result = await query(
      'SELECT * FROM progress_stats WHERE user_id = $1',
      [userId]
    );
  }

  const progress = result.rows[0];

  // Get most common fallacy details
  if (progress.most_common_fallacy_id) {
    const fallacyResult = await query(
      'SELECT name, category, description FROM fallacies WHERE id = $1',
      [progress.most_common_fallacy_id]
    );

    if (fallacyResult.rows.length > 0) {
      progress.most_common_fallacy = fallacyResult.rows[0];
    }
  }

  res.json({
    success: true,
    data: progress,
  });
};

export const getDetailedStats = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  // Overall statistics
  const overallStats = await query(
    `SELECT
      COUNT(DISTINCT a.id) as total_arguments,
      COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_arguments,
      COUNT(DISTINCT fi.id) as total_fallacies_detected,
      AVG(r.confidence_score) as avg_confidence_score,
      AVG(EXTRACT(EPOCH FROM (a.analysis_completed_at - a.analysis_started_at))) as avg_analysis_time_seconds
     FROM arguments a
     LEFT JOIN refutations r ON a.id = r.argument_id
     LEFT JOIN fallacy_instances fi ON r.id = fi.refutation_id
     WHERE a.user_id = $1`,
    [userId]
  );

  // Fallacy breakdown
  const fallacyBreakdown = await query(
    `SELECT
      f.name,
      f.category,
      f.severity,
      COUNT(fi.id) as count,
      AVG(CASE WHEN fi.severity = 'critical' THEN 4
               WHEN fi.severity = 'high' THEN 3
               WHEN fi.severity = 'medium' THEN 2
               ELSE 1 END) as avg_severity_score
     FROM fallacy_instances fi
     JOIN fallacies f ON fi.fallacy_id = f.id
     JOIN refutations r ON fi.refutation_id = r.id
     JOIN arguments a ON r.argument_id = a.id
     WHERE a.user_id = $1
     GROUP BY f.id, f.name, f.category, f.severity
     ORDER BY count DESC
     LIMIT 10`,
    [userId]
  );

  // Progress over time (last 30 days)
  const progressOverTime = await query(
    `SELECT
      DATE(a.created_at) as date,
      COUNT(DISTINCT a.id) as arguments_count,
      COUNT(DISTINCT fi.id) as fallacies_count,
      AVG(r.confidence_score) as avg_confidence
     FROM arguments a
     LEFT JOIN refutations r ON a.id = r.argument_id
     LEFT JOIN fallacy_instances fi ON r.id = fi.refutation_id
     WHERE a.user_id = $1 AND a.created_at >= CURRENT_DATE - INTERVAL '30 days'
     GROUP BY DATE(a.created_at)
     ORDER BY date ASC`,
    [userId]
  );

  // Subject distribution
  const subjectDistribution = await query(
    `SELECT
      subject,
      COUNT(*) as count,
      AVG(r.confidence_score) as avg_confidence
     FROM arguments a
     LEFT JOIN refutations r ON a.id = r.argument_id
     WHERE a.user_id = $1
     GROUP BY subject
     ORDER BY count DESC`,
    [userId]
  );

  // Recent improvements (comparing last 5 vs previous 5 arguments)
  const improvementStats = await query(
    `WITH recent AS (
      SELECT AVG(r.confidence_score) as recent_avg
      FROM (
        SELECT r.confidence_score
        FROM arguments a
        JOIN refutations r ON a.id = r.argument_id
        WHERE a.user_id = $1 AND a.status = 'completed'
        ORDER BY a.created_at DESC
        LIMIT 5
      ) recent_args
    ),
    previous AS (
      SELECT AVG(r.confidence_score) as previous_avg
      FROM (
        SELECT r.confidence_score
        FROM arguments a
        JOIN refutations r ON a.id = r.argument_id
        WHERE a.user_id = $1 AND a.status = 'completed'
        ORDER BY a.created_at DESC
        OFFSET 5 LIMIT 5
      ) previous_args
    )
    SELECT
      recent.recent_avg,
      previous.previous_avg,
      (recent.recent_avg - previous.previous_avg) as improvement
    FROM recent, previous`,
    [userId]
  );

  res.json({
    success: true,
    data: {
      overall: overallStats.rows[0],
      fallacy_breakdown: fallacyBreakdown.rows,
      progress_over_time: progressOverTime.rows,
      subject_distribution: subjectDistribution.rows,
      improvement: improvementStats.rows[0] || { improvement: 0 },
    },
  });
};

export const updateProgress = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  // Recalculate progress statistics
  const stats = await query(
    `WITH argument_stats AS (
      SELECT
        COUNT(DISTINCT a.id) as total_args,
        COUNT(DISTINCT CASE WHEN fi.id IS NOT NULL THEN a.id END) as args_with_fallacies,
        AVG(r.confidence_score) as avg_conf
      FROM arguments a
      LEFT JOIN refutations r ON a.id = r.argument_id
      LEFT JOIN fallacy_instances fi ON r.id = fi.refutation_id
      WHERE a.user_id = $1
    ),
    most_common AS (
      SELECT fi.fallacy_id, COUNT(*) as count
      FROM fallacy_instances fi
      JOIN refutations r ON fi.refutation_id = r.id
      JOIN arguments a ON r.argument_id = a.id
      WHERE a.user_id = $1
      GROUP BY fi.fallacy_id
      ORDER BY count DESC
      LIMIT 1
    ),
    streak_calc AS (
      SELECT
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as current_streak
      FROM arguments
      WHERE user_id = $1 AND status = 'completed'
    )
    UPDATE progress_stats
    SET
      total_arguments = (SELECT total_args FROM argument_stats),
      arguments_with_fallacies = (SELECT args_with_fallacies FROM argument_stats),
      average_confidence_score = (SELECT avg_conf FROM argument_stats),
      most_common_fallacy_id = (SELECT fallacy_id FROM most_common),
      current_streak = (SELECT current_streak FROM streak_calc),
      mastery_level = CASE
        WHEN (SELECT avg_conf FROM argument_stats) >= 0.9 AND (SELECT total_args FROM argument_stats) >= 20 THEN 'expert'
        WHEN (SELECT avg_conf FROM argument_stats) >= 0.8 AND (SELECT total_args FROM argument_stats) >= 10 THEN 'advanced'
        WHEN (SELECT avg_conf FROM argument_stats) >= 0.7 AND (SELECT total_args FROM argument_stats) >= 5 THEN 'intermediate'
        ELSE 'beginner'
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $1
    RETURNING *`,
    [userId]
  );

  if (stats.rows.length === 0) {
    throw new AppError('Failed to update progress', 500);
  }

  res.json({
    success: true,
    message: 'Progress updated successfully',
    data: stats.rows[0],
  });
};

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const period = req.query.period as string || 'all_time'; // all_time, month, week

  let dateFilter = '';
  if (period === 'month') {
    dateFilter = "AND a.created_at >= CURRENT_DATE - INTERVAL '30 days'";
  } else if (period === 'week') {
    dateFilter = "AND a.created_at >= CURRENT_DATE - INTERVAL '7 days'";
  }

  const result = await query(
    `SELECT
      u.id,
      u.username,
      u.full_name,
      u.grade_level,
      COUNT(DISTINCT a.id) as total_arguments,
      AVG(r.confidence_score) as avg_confidence_score,
      ps.mastery_level,
      ps.current_streak
     FROM users u
     LEFT JOIN arguments a ON u.id = a.user_id ${dateFilter}
     LEFT JOIN refutations r ON a.id = r.argument_id
     LEFT JOIN progress_stats ps ON u.id = ps.user_id
     WHERE u.role = 'student'
     GROUP BY u.id, u.username, u.full_name, u.grade_level, ps.mastery_level, ps.current_streak
     HAVING COUNT(DISTINCT a.id) > 0
     ORDER BY avg_confidence_score DESC, total_arguments DESC
     LIMIT $1`,
    [limit]
  );

  res.json({
    success: true,
    data: result.rows,
  });
};
