/**
 * Substitution API Routes
 * 치환 문제 생성 및 검증 API
 */

const express = require('express');
const router = express.Router();

/**
 * 샘플 치환 문제 데이터
 * 실제로는 Python Pipeline에서 AI가 생성하게 됩니다
 */
const sampleProblems = {
  'basic-substitution-1': {
    id: 'basic-substitution-1',
    title: '기본 치환 문제',
    description: '변수를 치환하여 방정식을 풀어보세요',
    initialEquation: '2(x + 3) = 14',
    targetVariable: 'x',
    difficulty: 2,
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        originalExpression: '2(x + 3) = 14',
        substitutedExpression: '2y = 14',
        variableFrom: 'x + 3',
        variableTo: 'y',
        explanation: '(x + 3)을 y로 치환합니다',
        isCorrect: false
      },
      {
        id: 'step-2',
        stepNumber: 2,
        originalExpression: '2y = 14',
        substitutedExpression: 'y = 7',
        variableFrom: '2y',
        variableTo: 'y',
        explanation: '양변을 2로 나눕니다',
        isCorrect: false
      },
      {
        id: 'step-3',
        stepNumber: 3,
        originalExpression: 'y = 7',
        substitutedExpression: 'x + 3 = 7',
        variableFrom: 'y',
        variableTo: 'x + 3',
        explanation: 'y를 원래 식 (x + 3)으로 되돌립니다',
        isCorrect: false
      },
      {
        id: 'step-4',
        stepNumber: 4,
        originalExpression: 'x + 3 = 7',
        substitutedExpression: 'x = 4',
        variableFrom: 'x + 3',
        variableTo: 'x',
        explanation: '양변에서 3을 빼서 x의 값을 구합니다',
        isCorrect: false
      }
    ],
    hints: [
      '(x + 3) 전체를 하나의 변수로 생각해보세요',
      '양변을 같은 수로 나누면 등식이 유지됩니다',
      '치환한 변수를 원래 식으로 되돌려야 합니다',
      '마지막 단계에서 x의 값을 구합니다'
    ]
  },
  'intermediate-substitution-1': {
    id: 'intermediate-substitution-1',
    title: '중급 치환 문제',
    description: '복잡한 식의 치환을 연습해보세요',
    initialEquation: '3(2x - 5) + 4 = 19',
    targetVariable: 'x',
    difficulty: 3,
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        originalExpression: '3(2x - 5) + 4 = 19',
        substitutedExpression: '3y + 4 = 19',
        variableFrom: '2x - 5',
        variableTo: 'y',
        explanation: '(2x - 5)를 y로 치환합니다',
        isCorrect: false
      },
      {
        id: 'step-2',
        stepNumber: 2,
        originalExpression: '3y + 4 = 19',
        substitutedExpression: '3y = 15',
        variableFrom: '3y + 4',
        variableTo: '3y',
        explanation: '양변에서 4를 뺍니다',
        isCorrect: false
      },
      {
        id: 'step-3',
        stepNumber: 3,
        originalExpression: '3y = 15',
        substitutedExpression: 'y = 5',
        variableFrom: '3y',
        variableTo: 'y',
        explanation: '양변을 3으로 나눕니다',
        isCorrect: false
      },
      {
        id: 'step-4',
        stepNumber: 4,
        originalExpression: 'y = 5',
        substitutedExpression: '2x - 5 = 5',
        variableFrom: 'y',
        variableTo: '2x - 5',
        explanation: 'y를 원래 식으로 되돌립니다',
        isCorrect: false
      },
      {
        id: 'step-5',
        stepNumber: 5,
        originalExpression: '2x - 5 = 5',
        substitutedExpression: '2x = 10',
        variableFrom: '2x - 5',
        variableTo: '2x',
        explanation: '양변에 5를 더합니다',
        isCorrect: false
      },
      {
        id: 'step-6',
        stepNumber: 6,
        originalExpression: '2x = 10',
        substitutedExpression: 'x = 5',
        variableFrom: '2x',
        variableTo: 'x',
        explanation: '양변을 2로 나눠 x의 값을 구합니다',
        isCorrect: false
      }
    ],
    hints: [
      '괄호 안의 전체 식을 하나의 변수로 치환하세요',
      '상수항을 먼저 정리하세요',
      '계수로 나눕니다',
      '치환한 변수를 원래 식으로 되돌립니다',
      '다시 상수항을 정리합니다',
      '최종적으로 x의 값을 구합니다'
    ]
  }
};

/**
 * GET /api/substitution/problems
 * 모든 치환 문제 목록 조회
 */
router.get('/problems', (req, res) => {
  try {
    const problemList = Object.values(sampleProblems).map(problem => ({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      stepCount: problem.steps.length
    }));

    res.json({
      success: true,
      count: problemList.length,
      problems: problemList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/substitution/problems/:id
 * 특정 치환 문제 조회
 */
router.get('/problems/:id', (req, res) => {
  try {
    const { id } = req.params;
    const problem = sampleProblems[id];

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found',
        message: `Problem with id '${id}' does not exist`
      });
    }

    res.json({
      success: true,
      problem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/substitution/validate
 * 치환 답안 검증
 */
router.post('/validate', (req, res) => {
  try {
    const { problemId, stepId, userAnswer } = req.body;

    if (!problemId || !stepId || !userAnswer) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'problemId, stepId, and userAnswer are required'
      });
    }

    const problem = sampleProblems[problemId];
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    const step = problem.steps.find(s => s.id === stepId);
    if (!step) {
      return res.status(404).json({
        success: false,
        error: 'Step not found'
      });
    }

    // 답안 검증 (대소문자 무시, 공백 제거)
    const normalizedUserAnswer = userAnswer.trim().toLowerCase().replace(/\s/g, '');
    const normalizedCorrectAnswer = step.substitutedExpression.toLowerCase().replace(/\s/g, '');

    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

    // 부분 정답 체크
    const hasCorrectVariable = normalizedUserAnswer.includes(step.variableTo.toLowerCase());

    let status, glowColor, feedback;

    if (isCorrect) {
      status = 'correct';
      glowColor = 'green';
      feedback = '정답입니다! 올바른 치환이에요. 🎉';
    } else if (hasCorrectVariable) {
      status = 'partial';
      glowColor = 'orange';
      feedback = `변수는 맞지만 식이 완전하지 않아요. 힌트: ${step.explanation}`;
    } else {
      status = 'incorrect';
      glowColor = 'red';
      feedback = '다시 한번 시도해보세요. 힌트를 확인하세요!';
    }

    res.json({
      success: true,
      validation: {
        isCorrect,
        status,
        glowColor,
        feedback,
        correctAnswer: isCorrect ? undefined : step.substitutedExpression
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/substitution/submit
 * 전체 문제 제출 및 점수 계산
 */
router.post('/submit', (req, res) => {
  try {
    const { problemId, attempts } = req.body;

    if (!problemId || !attempts || !Array.isArray(attempts)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'problemId and attempts array are required'
      });
    }

    const problem = sampleProblems[problemId];
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    // 점수 계산
    const totalSteps = problem.steps.length;
    const correctAttempts = attempts.filter(a => a.isCorrect).length;
    const score = Math.round((correctAttempts / totalSteps) * 100);

    res.json({
      success: true,
      result: {
        problemId,
        totalSteps,
        correctSteps: correctAttempts,
        score,
        grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D',
        completedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
