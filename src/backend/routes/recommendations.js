const express = require('express');
const db = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Get personalized sequence recommendations
 * GET /api/recommendations
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    let recommendations;

    if (req.user) {
      // Authenticated user - personalized recommendations
      recommendations = await getPersonalizedRecommendations(req.user.id);
    } else {
      // Guest user - default recommendations
      recommendations = await getDefaultRecommendations();
    }

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations'
    });
  }
});

/**
 * Get next recommended sequence
 * GET /api/recommendations/next
 */
router.get('/next', authenticate, async (req, res) => {
  try {
    const nextSequence = await getNextRecommendation(req.user.id);

    if (!nextSequence) {
      return res.json({
        success: true,
        data: null,
        message: 'No more sequences available at your level'
      });
    }

    res.json({
      success: true,
      data: nextSequence
    });
  } catch (error) {
    console.error('Get next recommendation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get next recommendation'
    });
  }
});

/**
 * Get learning path recommendations
 * GET /api/recommendations/path
 */
router.get('/path', authenticate, async (req, res) => {
  try {
    const learningPath = await generateLearningPath(req.user.id);

    res.json({
      success: true,
      data: learningPath
    });
  } catch (error) {
    console.error('Get learning path error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate learning path'
    });
  }
});

/**
 * Personalized recommendations based on user progress and performance
 */
async function getPersonalizedRecommendations(userId) {
  // Get user info
  const [users] = await db.query('SELECT level FROM users WHERE id = ?', [userId]);
  const userLevel = users[0]?.level || 1;

  // Get completed sequences
  const [completed] = await db.query(`
    SELECT sequence_id, score, completion_status
    FROM progress
    WHERE user_id = ? AND completion_status = 'completed'
  `, [userId]);

  const completedIds = completed.map(p => p.sequence_id);
  const avgScore = completed.length > 0
    ? completed.reduce((sum, p) => sum + (p.score || 0), 0) / completed.length
    : 0;

  // Get in-progress sequences
  const [inProgress] = await db.query(`
    SELECT s.*, p.score, p.time_spent, p.last_interaction
    FROM sequences s
    JOIN progress p ON s.id = p.sequence_id
    WHERE p.user_id = ? AND p.completion_status = 'in_progress'
    ORDER BY p.last_interaction DESC
    LIMIT 3
  `, [userId]);

  // Determine target difficulty
  let targetLevel = userLevel;
  if (avgScore >= 90) {
    targetLevel = Math.min(userLevel + 1, 5); // Challenge user
  } else if (avgScore < 60) {
    targetLevel = Math.max(userLevel - 1, 1); // Provide easier content
  }

  // Get recommended sequences
  const excludeIds = completedIds.length > 0 ? completedIds : [-1];

  const [recommended] = await db.query(`
    SELECT s.*,
           IFNULL(AVG(p.score), 0) as avg_score,
           COUNT(DISTINCT p.user_id) as popularity
    FROM sequences s
    LEFT JOIN progress p ON s.id = p.sequence_id AND p.completion_status = 'completed'
    WHERE s.id NOT IN (?)
      AND s.difficulty_level BETWEEN ? AND ?
    GROUP BY s.id
    ORDER BY
      ABS(s.difficulty_level - ?) ASC,
      popularity DESC,
      avg_score DESC
    LIMIT 6
  `, [excludeIds, targetLevel - 1, targetLevel + 1, targetLevel]);

  return {
    user_level: userLevel,
    target_level: targetLevel,
    average_score: Math.round(avgScore),
    in_progress: inProgress,
    recommended: recommended,
    recommendation_reason: getRecommendationReason(userLevel, avgScore, targetLevel)
  };
}

/**
 * Default recommendations for non-authenticated users
 */
async function getDefaultRecommendations() {
  const [sequences] = await db.query(`
    SELECT s.*,
           IFNULL(AVG(p.score), 0) as avg_score,
           COUNT(DISTINCT p.user_id) as popularity
    FROM sequences s
    LEFT JOIN progress p ON s.id = p.sequence_id
    WHERE s.difficulty_level = 1
    GROUP BY s.id
    ORDER BY popularity DESC, s.name
    LIMIT 6
  `);

  return {
    user_level: 1,
    target_level: 1,
    recommended: sequences,
    recommendation_reason: 'Start with beginner-friendly sequences'
  };
}

/**
 * Get next single recommendation
 */
async function getNextRecommendation(userId) {
  const recommendations = await getPersonalizedRecommendations(userId);
  return recommendations.recommended[0] || null;
}

/**
 * Generate a complete learning path
 */
async function generateLearningPath(userId) {
  const [user] = await db.query('SELECT level FROM users WHERE id = ?', [userId]);
  const userLevel = user[0]?.level || 1;

  // Get completed sequences
  const [completed] = await db.query(`
    SELECT sequence_id FROM progress
    WHERE user_id = ? AND completion_status = 'completed'
  `, [userId]);

  const completedIds = completed.map(p => p.sequence_id);
  const excludeIds = completedIds.length > 0 ? completedIds : [-1];

  // Generate path for current level and next level
  const [path] = await db.query(`
    SELECT s.*,
           CASE
             WHEN s.difficulty_level = ? THEN 1
             WHEN s.difficulty_level = ? THEN 2
             ELSE 3
           END as priority
    FROM sequences s
    WHERE s.id NOT IN (?)
      AND s.difficulty_level BETWEEN ? AND ?
    ORDER BY priority, s.difficulty_level, s.name
    LIMIT 10
  `, [userLevel, userLevel + 1, excludeIds, userLevel, Math.min(userLevel + 2, 5)]);

  return {
    current_level: userLevel,
    completed_count: completedIds.length,
    path: path,
    estimated_completion_time: path.length * 15, // 15 minutes per sequence
    next_level_requirements: {
      level: userLevel + 1,
      sequences_needed: Math.max(3 - completedIds.length, 0)
    }
  };
}

/**
 * Get recommendation reason text
 */
function getRecommendationReason(userLevel, avgScore, targetLevel) {
  if (avgScore >= 90) {
    return `훌륭한 성과입니다! Level ${targetLevel}의 도전적인 문제를 추천합니다.`;
  } else if (avgScore >= 70) {
    return `좋은 진행입니다! 현재 Level ${userLevel}에 적합한 문제들을 추천합니다.`;
  } else if (avgScore >= 50) {
    return `더 연습이 필요합니다. 기초를 다질 수 있는 문제를 추천합니다.`;
  } else {
    return `처음부터 차근차근 학습해봅시다. 쉬운 Level ${targetLevel} 문제부터 시작하세요.`;
  }
}

module.exports = router;
