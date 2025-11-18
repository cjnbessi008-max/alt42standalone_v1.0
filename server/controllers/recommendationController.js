/**
 * Recommendation Controller
 * AI 기반 문제 추천 시스템
 * 학생의 수행 데이터를 분석하여 최적의 문제를 추천
 */

const db = require('../models/database');

/**
 * 사용자 맞춤 문제 추천
 * 학생의 현재 레벨과 선호도를 고려한 문제 추천
 */
async function getRecommendedProblems(req, res) {
  try {
    const userId = req.user.userId;
    const { limit = 5 } = req.query;

    // 1. 사용자의 최근 활동 분석
    const userActivity = await analyzeUserActivity(userId);

    // 2. 현재 난이도 추정
    const currentLevel = estimateUserLevel(userActivity);

    // 3. 취약 영역 파악
    const weakAreas = identifyWeakAreas(userActivity);

    // 4. 추천 문제 선택
    const recommendedProblems = await selectProblems(
      currentLevel,
      weakAreas,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: {
        currentLevel,
        weakAreas,
        problems: recommendedProblems,
        reason: generateRecommendationReason(currentLevel, weakAreas)
      }
    });
  } catch (error) {
    console.error('Get recommended problems error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommended problems',
      message: error.message
    });
  }
}

/**
 * 다음 난이도 추천
 */
async function getNextLevel(req, res) {
  try {
    const userId = req.user.userId;

    const userActivity = await analyzeUserActivity(userId);
    const currentLevel = estimateUserLevel(userActivity);

    // 레벨업 조건 체크
    const canLevelUp = checkLevelUpCondition(userActivity, currentLevel);

    res.json({
      success: true,
      data: {
        currentLevel,
        nextLevel: canLevelUp ? currentLevel + 1 : currentLevel,
        canLevelUp,
        progressPercentage: calculateLevelProgress(userActivity, currentLevel),
        requirements: getLevelUpRequirements(currentLevel)
      }
    });
  } catch (error) {
    console.error('Get next level error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get next level recommendation',
      message: error.message
    });
  }
}

/**
 * 취약점 분석 기반 추천
 */
async function getWeakAreasRecommendation(req, res) {
  try {
    const userId = req.user.userId;

    const userActivity = await analyzeUserActivity(userId);
    const weakAreas = identifyWeakAreas(userActivity);

    // 취약 영역별 강화 문제 추천
    const recommendations = [];

    for (const area of weakAreas) {
      const problems = await db.query(
        `SELECT * FROM problems
         WHERE problem_type = ?
         AND difficulty_level = ?
         AND is_active = 1
         ORDER BY RAND()
         LIMIT 3`,
        [area.type, area.recommendedLevel]
      );

      recommendations.push({
        area: area.type,
        accuracy: area.accuracy,
        problems: problems
      });
    }

    res.json({
      success: true,
      data: {
        weakAreas: recommendations,
        message: '취약한 영역을 강화할 수 있는 문제들을 추천합니다.'
      }
    });
  } catch (error) {
    console.error('Get weak areas recommendation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get weak areas recommendation',
      message: error.message
    });
  }
}

/**
 * 사용자 활동 분석
 */
async function analyzeUserActivity(userId) {
  const stats = await db.queryOne(
    `SELECT
      COUNT(*) AS total_attempts,
      SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct_attempts,
      AVG(score) AS avg_score,
      AVG(time_spent) AS avg_time_spent
     FROM activity_logs
     WHERE user_id = ?
     AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
    [userId]
  );

  // 문제 유형별 정확도
  const accuracyByType = await db.query(
    `SELECT
      p.problem_type,
      p.difficulty_level,
      COUNT(*) AS attempts,
      SUM(CASE WHEN al.is_correct = 1 THEN 1 ELSE 0 END) AS correct,
      (SUM(CASE WHEN al.is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS accuracy
     FROM activity_logs al
     JOIN problems p ON al.problem_id = p.id
     WHERE al.user_id = ?
     AND al.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY p.problem_type, p.difficulty_level`,
    [userId]
  );

  return {
    overall: stats,
    byType: accuracyByType
  };
}

/**
 * 사용자 레벨 추정
 */
function estimateUserLevel(userActivity) {
  const { overall, byType } = userActivity;

  if (!overall || overall.total_attempts === 0) {
    return 1; // 초보자
  }

  const accuracy = (overall.correct_attempts / overall.total_attempts) * 100;

  // 정확도 기반 레벨 추정
  if (accuracy >= 90) return 5; // 최고 레벨
  if (accuracy >= 75) return 4;
  if (accuracy >= 60) return 3;
  if (accuracy >= 40) return 2;
  return 1;
}

/**
 * 취약 영역 파악
 */
function identifyWeakAreas(userActivity) {
  const { byType } = userActivity;

  if (!byType || byType.length === 0) {
    return [];
  }

  // 정확도 60% 미만인 영역
  const weakAreas = byType
    .filter(item => item.accuracy < 60)
    .map(item => ({
      type: item.problem_type,
      accuracy: item.accuracy,
      attempts: item.attempts,
      recommendedLevel: Math.max(1, item.difficulty_level - 1) // 한 단계 낮은 난이도 추천
    }))
    .sort((a, b) => a.accuracy - b.accuracy); // 정확도 낮은 순

  return weakAreas;
}

/**
 * 문제 선택
 */
async function selectProblems(currentLevel, weakAreas, limit) {
  let problems = [];

  // 1. 취약 영역이 있으면 해당 영역 문제 50% 포함
  if (weakAreas.length > 0) {
    const weakAreaLimit = Math.ceil(limit / 2);
    const weakAreaType = weakAreas[0].type;

    const weakAreaProblems = await db.query(
      `SELECT * FROM problems
       WHERE problem_type = ?
       AND difficulty_level = ?
       AND is_active = 1
       ORDER BY RAND()
       LIMIT ?`,
      [weakAreaType, weakAreas[0].recommendedLevel, weakAreaLimit]
    );

    problems = problems.concat(weakAreaProblems);
  }

  // 2. 나머지는 현재 레벨에 맞는 다양한 문제
  const remainingLimit = limit - problems.length;

  if (remainingLimit > 0) {
    const levelProblems = await db.query(
      `SELECT * FROM problems
       WHERE difficulty_level IN (?, ?)
       AND is_active = 1
       ${problems.length > 0 ? 'AND id NOT IN (?)' : ''}
       ORDER BY RAND()
       LIMIT ?`,
      problems.length > 0
        ? [currentLevel, currentLevel + 1, problems.map(p => p.id), remainingLimit]
        : [currentLevel, currentLevel + 1, remainingLimit]
    );

    problems = problems.concat(levelProblems);
  }

  return problems;
}

/**
 * 추천 이유 생성
 */
function generateRecommendationReason(currentLevel, weakAreas) {
  let reason = `현재 레벨: ${currentLevel}`;

  if (weakAreas.length > 0) {
    reason += `\n취약 영역: ${weakAreas.map(a => a.type).join(', ')}`;
    reason += `\n추천: 취약 영역 강화를 위한 기초 문제부터 풀어보세요.`;
  } else {
    reason += `\n상태: 전반적으로 우수한 성적입니다!`;
    reason += `\n추천: 더 높은 난이도의 문제에 도전해보세요.`;
  }

  return reason;
}

/**
 * 레벨업 조건 체크
 */
function checkLevelUpCondition(userActivity, currentLevel) {
  const { overall } = userActivity;

  if (!overall || overall.total_attempts < 10) {
    return false; // 최소 10번 이상 시도 필요
  }

  const accuracy = (overall.correct_attempts / overall.total_attempts) * 100;

  // 레벨별 레벨업 조건
  const levelUpThreshold = {
    1: 70,
    2: 75,
    3: 80,
    4: 85,
    5: 90
  };

  return accuracy >= (levelUpThreshold[currentLevel] || 75);
}

/**
 * 레벨 진행도 계산
 */
function calculateLevelProgress(userActivity, currentLevel) {
  const { overall } = userActivity;

  if (!overall || overall.total_attempts === 0) {
    return 0;
  }

  const accuracy = (overall.correct_attempts / overall.total_attempts) * 100;
  const levelUpThreshold = {
    1: 70,
    2: 75,
    3: 80,
    4: 85,
    5: 90
  };

  const threshold = levelUpThreshold[currentLevel] || 75;
  const progress = Math.min(100, (accuracy / threshold) * 100);

  return Math.round(progress);
}

/**
 * 레벨업 요구사항
 */
function getLevelUpRequirements(currentLevel) {
  const requirements = {
    1: { accuracy: 70, minAttempts: 10, message: '정확도 70% 이상, 최소 10문제 풀이' },
    2: { accuracy: 75, minAttempts: 15, message: '정확도 75% 이상, 최소 15문제 풀이' },
    3: { accuracy: 80, minAttempts: 20, message: '정확도 80% 이상, 최소 20문제 풀이' },
    4: { accuracy: 85, minAttempts: 25, message: '정확도 85% 이상, 최소 25문제 풀이' },
    5: { accuracy: 90, minAttempts: 30, message: '정확도 90% 이상, 최소 30문제 풀이 (최고 레벨)' }
  };

  return requirements[currentLevel] || requirements[1];
}

module.exports = {
  getRecommendedProblems,
  getNextLevel,
  getWeakAreasRecommendation
};
