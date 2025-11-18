/**
 * 적분 문제 API 라우트
 */

import { Router } from 'express';
import { MoodleService } from '../services/MoodleService.js';
import { IntegralAnalyzer } from '../services/IntegralAnalyzer.js';

const router = Router();
const moodleService = new MoodleService();
const analyzer = new IntegralAnalyzer();

/**
 * GET /api/problems
 * Moodle에서 적분 문제 목록 가져오기
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const problems = await moodleService.getIntegralProblemsFromDB(limit);

    res.json({
      success: true,
      data: problems,
      count: problems.length,
    });
  } catch (error) {
    console.error('문제 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '문제를 불러올 수 없습니다.',
    });
  }
});

/**
 * GET /api/problems/:id
 * 특정 문제 상세 정보 가져오기
 */
router.get('/:id', async (req, res) => {
  try {
    const problemId = parseInt(req.params.id);
    const problem = await moodleService.getProblemById(problemId);

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: '문제를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: problem,
    });
  } catch (error) {
    console.error('문제 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '문제를 불러올 수 없습니다.',
    });
  }
});

/**
 * POST /api/problems/analyze
 * LaTeX 수식을 분석하여 핵심 규칙 및 하이라이팅 정보 반환
 */
router.post('/analyze', async (req, res) => {
  try {
    const { latex, problemText } = req.body;

    if (!latex) {
      return res.status(400).json({
        success: false,
        error: 'LaTeX 수식이 필요합니다.',
      });
    }

    const analyzedProblem = analyzer.analyzeProblem(latex, problemText || '');

    res.json({
      success: true,
      data: analyzedProblem,
    });
  } catch (error) {
    console.error('문제 분석 실패:', error);
    res.status(500).json({
      success: false,
      error: '문제를 분석할 수 없습니다.',
    });
  }
});

/**
 * GET /api/problems/sample/list
 * 샘플 적분 문제 목록 제공
 */
router.get('/sample/list', (req, res) => {
  const sampleProblems = [
    {
      id: 'sample_1',
      problemText: 'x^2를 적분하시오.',
      latex: '\\int x^2 \\, dx',
      difficulty: 'easy',
      integralType: 'power_rule',
    },
    {
      id: 'sample_2',
      problemText: '3x^4를 적분하시오.',
      latex: '\\int 3x^4 \\, dx',
      difficulty: 'easy',
      integralType: 'power_rule',
    },
    {
      id: 'sample_3',
      problemText: 'e^x를 적분하시오.',
      latex: '\\int e^x \\, dx',
      difficulty: 'easy',
      integralType: 'exponential',
    },
    {
      id: 'sample_4',
      problemText: 'sin(x)를 적분하시오.',
      latex: '\\int \\sin(x) \\, dx',
      difficulty: 'easy',
      integralType: 'trigonometric',
    },
    {
      id: 'sample_5',
      problemText: '1/x를 적분하시오.',
      latex: '\\int \\frac{1}{x} \\, dx',
      difficulty: 'medium',
      integralType: 'logarithmic',
    },
    {
      id: 'sample_6',
      problemText: 'x^3 + 2x^2 - 5x + 1을 적분하시오.',
      latex: '\\int (x^3 + 2x^2 - 5x + 1) \\, dx',
      difficulty: 'medium',
      integralType: 'power_rule',
    },
  ];

  res.json({
    success: true,
    data: sampleProblems,
    count: sampleProblems.length,
  });
});

/**
 * GET /api/rules
 * 모든 핵심 적분 규칙 가져오기
 */
router.get('/rules/all', (req, res) => {
  const rules = analyzer.getAllCoreRules();

  res.json({
    success: true,
    data: rules,
    count: rules.length,
  });
});

export default router;
