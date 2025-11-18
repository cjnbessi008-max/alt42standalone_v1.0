const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get student progress for a module
 */
const getProgress = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const studentId = req.user.id;

    const result = await query(
      'SELECT * FROM student_progress WHERE student_id = $1 AND module_id = $2',
      [studentId, moduleId]
    );

    const progress = result.rows[0] || {
      student_id: studentId,
      module_id: moduleId,
      progress_percentage: 0,
      mastery_level: 'beginner',
      total_attempts: 0,
      correct_attempts: 0,
      accuracy_percentage: 0,
    };

    // Calculate time to mastery estimate
    let timeToMastery = null;
    if (progress.total_attempts > 0 && progress.accuracy_percentage < 100) {
      const remainingAccuracy = 100 - progress.accuracy_percentage;
      const improvementRate = progress.accuracy_percentage / progress.total_attempts;
      if (improvementRate > 0) {
        timeToMastery = Math.ceil(remainingAccuracy / improvementRate);
      }
    }

    res.json({
      success: true,
      data: {
        progress: {
          percentage: progress.progress_percentage,
          mastery_level: progress.mastery_level,
          accuracy_percentage: progress.accuracy_percentage,
          total_attempts: progress.total_attempts,
          correct_attempts: progress.correct_attempts,
          last_attempt_at: progress.last_attempt_at,
        },
        estimates: {
          time_to_mastery: timeToMastery,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        studentId,
        moduleId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student progress history
 */
const getProgressHistory = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const studentId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await query(
      `SELECT id, problem_id, attempted_at, is_correct, time_spent_seconds, hints_used, difficulty_level
       FROM problem_attempt
       WHERE student_id = $1 AND module_id = $2
       ORDER BY attempted_at DESC
       LIMIT $3 OFFSET $4`,
      [studentId, moduleId, limit, offset]
    );

    // Calculate accuracy trend
    const attempts = result.rows;
    const accuracyTrend = [];
    let cumulativeCorrect = 0;

    for (let i = 0; i < attempts.length; i++) {
      if (attempts[i].is_correct) cumulativeCorrect++;
      accuracyTrend.push({
        attempt_number: i + 1,
        accuracy: ((cumulativeCorrect / (i + 1)) * 100).toFixed(2),
        timestamp: attempts[i].attempted_at,
      });
    }

    res.json({
      success: true,
      data: {
        attempts: attempts.map((a) => ({
          id: a.id,
          problem_id: a.problem_id,
          attempted_at: a.attempted_at,
          is_correct: a.is_correct,
          time_spent: a.time_spent_seconds,
          hints_used: a.hints_used,
          difficulty_level: a.difficulty_level,
        })),
        accuracy_trend: accuracyTrend.reverse(),
        pagination: {
          limit,
          offset,
          total: attempts.length,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        studentId,
        moduleId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get mastery metrics for a module
 */
const getMasteryMetrics = async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    const result = await query(
      'SELECT * FROM mastery_metrics WHERE module_id = $1',
      [moduleId]
    );

    const metrics = result.rows.map((m) => ({
      topic_id: m.topic_id,
      required_correct_attempts: m.required_correct_attempts,
      min_accuracy_percentage: m.min_accuracy_percentage,
      consecutive_correct: m.consecutive_correct,
      time_window_days: m.time_window_days,
    }));

    res.json({
      success: true,
      data: {
        metrics,
      },
      meta: {
        timestamp: new Date().toISOString(),
        moduleId,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProgress,
  getProgressHistory,
  getMasteryMetrics,
};
