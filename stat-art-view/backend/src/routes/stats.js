const express = require('express');
const router = express.Router();
const moodleService = require('../services/moodleService');

/**
 * GET /api/stats/quiz/:quizId
 * 퀴즈 전체 통계 조회
 */
router.get('/quiz/:quizId', async (req, res, next) => {
  try {
    const { quizId } = req.params;

    const [basicStats, questionStats, difficultyDist] = await Promise.all([
      moodleService.getQuizStatistics(quizId),
      moodleService.getQuestionStatistics(quizId),
      moodleService.getQuestionDifficultyDistribution(quizId)
    ]);

    res.json({
      success: true,
      data: {
        overview: basicStats,
        questions: questionStats,
        difficulty: difficultyDist,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stats/student/:studentId
 * 학생별 전체 통계 조회
 */
router.get('/student/:studentId', async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { quizId } = req.query;

    const results = await moodleService.getStudentQuizResults(
      studentId,
      quizId || null
    );

    // 학생 성적 요약 계산
    const summary = {
      totalAttempts: results.length,
      averageScore: results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length || 0,
      bestScore: Math.max(...results.map(r => r.percentage || 0)),
      worstScore: Math.min(...results.map(r => r.percentage || 0)),
      totalTimeSpent: results.reduce((sum, r) => sum + (r.time_taken || 0), 0)
    };

    res.json({
      success: true,
      data: {
        summary,
        attempts: results,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stats/course/:courseId
 * 코스 전체 통계 조회
 */
router.get('/course/:courseId', async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const stats = await moodleService.getCourseStatistics(courseId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stats/heatmap/:courseId
 * 활동 히트맵 데이터 조회
 */
router.get('/heatmap/:courseId', async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { startDate, endDate } = req.query;

    // 기본값: 최근 30일
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const heatmapData = await moodleService.getActivityHeatmap(
      courseId,
      start,
      end
    );

    // 히트맵 포맷으로 변환
    const formatted = heatmapData.reduce((acc, row) => {
      if (!acc[row.date]) {
        acc[row.date] = {};
      }
      acc[row.date][row.hour] = {
        count: row.activity_count,
        avgScore: row.avg_score
      };
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        range: { start, end },
        heatmap: formatted,
        raw: heatmapData
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stats/artdata/:quizId
 * Stat Art View용 특화 데이터
 */
router.get('/artdata/:quizId', async (req, res, next) => {
  try {
    const { quizId } = req.params;

    const [questionStats, difficultyDist] = await Promise.all([
      moodleService.getQuestionStatistics(quizId),
      moodleService.getQuestionDifficultyDistribution(quizId)
    ]);

    // 방사형 차트용 데이터 변환
    const radialData = questionStats.map((q, index) => ({
      id: q.question_id,
      name: q.question_name,
      angle: (360 / questionStats.length) * index,
      value: parseFloat(q.correct_rate) || 0,
      radius: parseFloat(q.correct_rate) || 0,
      difficulty: difficultyDist.details.find(d => d.id === q.question_id)?.difficulty || 'medium',
      attempts: q.total_attempts,
      color: getDifficultyColor(
        difficultyDist.details.find(d => d.id === q.question_id)?.difficulty
      )
    }));

    // 파티클 데이터 생성
    const particleData = questionStats.map((q, index) => ({
      id: q.question_id,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.sqrt(q.total_attempts) * 2,
      velocity: (100 - (parseFloat(q.correct_rate) || 0)) / 10,
      opacity: parseFloat(q.correct_rate) / 100 || 0.5
    }));

    // 네트워크 데이터 (문제 간 상관관계 - 간단한 예시)
    const networkData = {
      nodes: questionStats.map(q => ({
        id: q.question_id,
        name: q.question_name,
        value: parseFloat(q.correct_rate) || 0,
        type: q.question_type
      })),
      links: []
    };

    res.json({
      success: true,
      data: {
        radial: radialData,
        particles: particleData,
        network: networkData,
        summary: {
          totalQuestions: questionStats.length,
          averageCorrectRate:
            questionStats.reduce((sum, q) => sum + (parseFloat(q.correct_rate) || 0), 0) /
            questionStats.length,
          difficultyBreakdown: {
            easy: difficultyDist.easy,
            medium: difficultyDist.medium,
            hard: difficultyDist.hard
          }
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 난이도에 따른 색상 반환
 */
function getDifficultyColor(difficulty) {
  const colors = {
    easy: '#10b981',    // 초록
    medium: '#f59e0b',  // 노랑
    hard: '#ef4444'     // 빨강
  };
  return colors[difficulty] || colors.medium;
}

module.exports = router;
