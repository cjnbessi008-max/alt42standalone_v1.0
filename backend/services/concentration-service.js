/**
 * Concentration Tracking Service
 *
 * Calculates student concentration scores based on multiple metrics:
 * - Time efficiency (how quickly problems are solved)
 * - Success rate (recent correct answers)
 * - Engagement (interaction frequency)
 * - Focus (tab switches, pauses)
 */

import pg from 'pg';
const { Pool } = pg;

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ai_education',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Calculate concentration score for a student in a module
 * @param {string} studentId - Student UUID
 * @param {string} moduleId - Module UUID
 * @param {number} recentAttemptsWindow - Number of recent attempts to consider (default: 5)
 * @returns {Promise<Object>} Concentration score data
 */
export async function calculateConcentrationScore(studentId, moduleId, recentAttemptsWindow = 5) {
  const client = await pool.connect();

  try {
    // Get recent attempts
    const attemptsQuery = `
      SELECT
        id,
        problem_id,
        is_correct,
        time_spent_seconds,
        interaction_count,
        pause_count,
        focus_lost_count,
        attempted_at
      FROM student_attempts
      WHERE student_id = $1 AND module_id = $2
      ORDER BY attempted_at DESC
      LIMIT $3
    `;

    const attemptsResult = await client.query(attemptsQuery, [studentId, moduleId, recentAttemptsWindow]);
    const attempts = attemptsResult.rows;

    if (attempts.length === 0) {
      // No attempts yet, return neutral score
      return {
        score: 0.75, // Start with slightly positive assumption
        timeEfficiencyScore: 0.75,
        successRateScore: 0.75,
        engagementScore: 0.75,
        focusScore: 0.75,
        recentAttemptsCount: 0,
        recentCorrectCount: 0,
        avgTimeSpent: 0,
        message: 'No recent attempts found'
      };
    }

    // Calculate component scores
    const timeEfficiencyScore = calculateTimeEfficiency(attempts);
    const successRateScore = calculateSuccessRate(attempts);
    const engagementScore = calculateEngagement(attempts);
    const focusScore = calculateFocus(attempts);

    // Weighted combination
    const overallScore = (
      timeEfficiencyScore * 0.25 +
      successRateScore * 0.35 +
      engagementScore * 0.20 +
      focusScore * 0.20
    );

    const recentCorrectCount = attempts.filter(a => a.is_correct).length;
    const avgTimeSpent = Math.round(
      attempts.reduce((sum, a) => sum + a.time_spent_seconds, 0) / attempts.length
    );

    // Save concentration score to database
    const saveQuery = `
      INSERT INTO concentration_scores (
        student_id,
        module_id,
        score,
        time_efficiency_score,
        success_rate_score,
        engagement_score,
        focus_score,
        recent_attempts_count,
        recent_correct_count,
        avg_time_spent_seconds
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const saveResult = await client.query(saveQuery, [
      studentId,
      moduleId,
      overallScore.toFixed(2),
      timeEfficiencyScore.toFixed(2),
      successRateScore.toFixed(2),
      engagementScore.toFixed(2),
      focusScore.toFixed(2),
      attempts.length,
      recentCorrectCount,
      avgTimeSpent
    ]);

    return {
      score: parseFloat(overallScore.toFixed(2)),
      timeEfficiencyScore: parseFloat(timeEfficiencyScore.toFixed(2)),
      successRateScore: parseFloat(successRateScore.toFixed(2)),
      engagementScore: parseFloat(engagementScore.toFixed(2)),
      focusScore: parseFloat(focusScore.toFixed(2)),
      recentAttemptsCount: attempts.length,
      recentCorrectCount,
      avgTimeSpent,
      concentrationScoreId: saveResult.rows[0].id
    };

  } finally {
    client.release();
  }
}

/**
 * Calculate time efficiency score
 * Higher score = solving problems in reasonable time
 */
function calculateTimeEfficiency(attempts) {
  const avgTime = attempts.reduce((sum, a) => sum + a.time_spent_seconds, 0) / attempts.length;

  // Ideal time range: 30-120 seconds
  const idealMin = 30;
  const idealMax = 120;

  if (avgTime < idealMin) {
    // Too fast - might be guessing
    return 0.60;
  } else if (avgTime >= idealMin && avgTime <= idealMax) {
    // Optimal range
    return 1.0;
  } else if (avgTime > idealMax && avgTime <= 180) {
    // Slightly slow but acceptable
    return 0.75;
  } else if (avgTime > 180 && avgTime <= 300) {
    // Getting slow - concentration may be dropping
    return 0.50;
  } else {
    // Very slow - likely distracted
    return 0.25;
  }
}

/**
 * Calculate success rate score
 */
function calculateSuccessRate(attempts) {
  const correctCount = attempts.filter(a => a.is_correct).length;
  const rate = correctCount / attempts.length;

  // Linear mapping from 0-100% correct
  return Math.max(0, Math.min(1, rate));
}

/**
 * Calculate engagement score based on interaction patterns
 */
function calculateEngagement(attempts) {
  const avgInteractions = attempts.reduce((sum, a) => sum + (a.interaction_count || 0), 0) / attempts.length;

  // Ideal interaction count: 5-20 per problem
  if (avgInteractions < 3) {
    // Too few interactions - might be disengaged
    return 0.40;
  } else if (avgInteractions >= 3 && avgInteractions <= 20) {
    // Good engagement
    return 1.0;
  } else {
    // Too many interactions - might be confused or struggling
    return 0.60;
  }
}

/**
 * Calculate focus score based on pauses and focus loss
 */
function calculateFocus(attempts) {
  const avgPauses = attempts.reduce((sum, a) => sum + (a.pause_count || 0), 0) / attempts.length;
  const avgFocusLoss = attempts.reduce((sum, a) => sum + (a.focus_lost_count || 0), 0) / attempts.length;

  let score = 1.0;

  // Penalize for pauses
  if (avgPauses > 0) {
    score -= Math.min(0.30, avgPauses * 0.10);
  }

  // Penalize for focus loss (tab switches, etc.)
  if (avgFocusLoss > 0) {
    score -= Math.min(0.40, avgFocusLoss * 0.15);
  }

  return Math.max(0.20, score);
}

/**
 * Check if bypass should be offered to student
 * @param {string} studentId - Student UUID
 * @param {string} moduleId - Module UUID
 * @param {string} currentProblemId - Current problem UUID
 * @returns {Promise<Object>} Bypass recommendation
 */
export async function checkBypassNeeded(studentId, moduleId, currentProblemId) {
  const client = await pool.connect();

  try {
    // Get latest concentration score
    const concentrationScore = await calculateConcentrationScore(studentId, moduleId);

    // Get module thresholds
    const thresholdQuery = `
      SELECT * FROM concentration_thresholds
      WHERE module_id = $1
    `;
    const thresholdResult = await client.query(thresholdQuery, [moduleId]);

    const threshold = thresholdResult.rows[0] || {
      bypass_trigger_score: 0.40,
      max_time_threshold_seconds: 300,
      max_failure_count: 3,
      difficulty_reduction: 1
    };

    // Check recent failures on current problem
    const failureQuery = `
      SELECT COUNT(*) as failure_count
      FROM student_attempts
      WHERE student_id = $1 AND problem_id = $2 AND is_correct = FALSE
      ORDER BY attempted_at DESC
      LIMIT 5
    `;
    const failureResult = await client.query(failureQuery, [studentId, currentProblemId]);
    const failureCount = parseInt(failureResult.rows[0].failure_count);

    // Determine if bypass should be offered
    const shouldOfferBypass =
      concentrationScore.score < threshold.bypass_trigger_score ||
      failureCount >= threshold.max_failure_count ||
      concentrationScore.avgTimeSpent > threshold.max_time_threshold_seconds;

    let triggerReason = null;
    if (shouldOfferBypass) {
      if (concentrationScore.score < threshold.bypass_trigger_score) {
        triggerReason = 'low_concentration';
      } else if (failureCount >= threshold.max_failure_count) {
        triggerReason = 'multiple_failures';
      } else if (concentrationScore.avgTimeSpent > threshold.max_time_threshold_seconds) {
        triggerReason = 'excessive_time';
      }
    }

    return {
      shouldOffer: shouldOfferBypass,
      triggerReason,
      concentrationScore: concentrationScore.score,
      failureCount,
      avgTimeSpent: concentrationScore.avgTimeSpent,
      threshold: threshold.bypass_trigger_score,
      difficultyReduction: threshold.difficulty_reduction
    };

  } finally {
    client.release();
  }
}

/**
 * Get an easier problem for bypass
 * @param {string} moduleId - Module UUID
 * @param {number} currentDifficulty - Current problem difficulty level
 * @param {number} reduction - How many levels to reduce (default: 1)
 * @returns {Promise<Object>} Easier problem
 */
export async function getEasierProblem(moduleId, currentDifficulty, reduction = 1) {
  const client = await pool.connect();

  try {
    const targetDifficulty = Math.max(1, currentDifficulty - reduction);

    const query = `
      SELECT * FROM problems
      WHERE module_id = $1 AND difficulty_level = $2
      ORDER BY RANDOM()
      LIMIT 1
    `;

    const result = await client.query(query, [moduleId, targetDifficulty]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];

  } finally {
    client.release();
  }
}

/**
 * Log bypass event
 * @param {Object} bypassData - Bypass event data
 * @returns {Promise<Object>} Created bypass event
 */
export async function logBypassEvent(bypassData) {
  const client = await pool.connect();

  try {
    const query = `
      INSERT INTO bypass_events (
        student_id,
        module_id,
        original_problem_id,
        bypass_problem_id,
        trigger_reason,
        concentration_score,
        original_difficulty,
        bypass_difficulty,
        accepted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await client.query(query, [
      bypassData.studentId,
      bypassData.moduleId,
      bypassData.originalProblemId,
      bypassData.bypassProblemId,
      bypassData.triggerReason,
      bypassData.concentrationScore,
      bypassData.originalDifficulty,
      bypassData.bypassDifficulty,
      bypassData.accepted
    ]);

    return result.rows[0];

  } finally {
    client.release();
  }
}

/**
 * Update bypass event when student completes or returns
 * @param {string} bypassEventId - Bypass event UUID
 * @param {Object} updates - Update data
 * @returns {Promise<Object>} Updated bypass event
 */
export async function updateBypassEvent(bypassEventId, updates) {
  const client = await pool.connect();

  try {
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    if (updates.accepted !== undefined) {
      setClauses.push(`accepted = $${paramIndex++}`);
      values.push(updates.accepted);
      setClauses.push(`accepted_at = NOW()`);
    }

    if (updates.bypassCompleted !== undefined) {
      setClauses.push(`bypass_completed = $${paramIndex++}`);
      values.push(updates.bypassCompleted);
    }

    if (updates.bypassSuccess !== undefined) {
      setClauses.push(`bypass_success = $${paramIndex++}`);
      values.push(updates.bypassSuccess);
    }

    if (updates.returnedToOriginal !== undefined) {
      setClauses.push(`returned_to_original = $${paramIndex++}`);
      values.push(updates.returnedToOriginal);
    }

    values.push(bypassEventId);

    const query = `
      UPDATE bypass_events
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await client.query(query, values);
    return result.rows[0];

  } finally {
    client.release();
  }
}

/**
 * Get concentration status for a student
 * @param {string} studentId - Student UUID
 * @param {string} moduleId - Module UUID
 * @returns {Promise<Object>} Concentration status
 */
export async function getConcentrationStatus(studentId, moduleId) {
  const client = await pool.connect();

  try {
    const query = `
      SELECT * FROM student_concentration_status
      WHERE student_id = $1 AND module_id = $2
    `;

    const result = await client.query(query, [studentId, moduleId]);

    if (result.rows.length === 0) {
      // Calculate fresh score if not exists
      const score = await calculateConcentrationScore(studentId, moduleId);
      return {
        studentId,
        moduleId,
        currentConcentrationScore: score.score,
        shouldOfferBypass: score.score < 0.40,
        ...score
      };
    }

    return result.rows[0];

  } finally {
    client.release();
  }
}

export default {
  calculateConcentrationScore,
  checkBypassNeeded,
  getEasierProblem,
  logBypassEvent,
  updateBypassEvent,
  getConcentrationStatus
};
