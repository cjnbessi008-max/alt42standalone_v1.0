/**
 * Mock API for Transform Scene
 * MySQL 없이 데모 모드로 작동하기 위한 Mock 데이터
 */

// 샘플 문제 데이터
const mockProblems = {
  1: {
    id: 1,
    problemType: 'translation',
    originalFunction: 'x^2',
    targetFunction: '(x-2)^2',
    transformType: 'translation_horizontal',
    transformParams: { h: 2, direction: 'right' },
    difficulty: 'easy',
    description: '함수 f(x) = x²를 오른쪽으로 2만큼 이동시킨 그래프를 관찰하세요.',
    hints: [
      '평행이동 공식: f(x-h)는 오른쪽으로 h만큼 이동합니다.',
      'h = 2를 적용하면 f(x-2) = (x-2)²가 됩니다.'
    ],
    createdAt: '2025-11-18T00:00:00Z',
    updatedAt: '2025-11-18T00:00:00Z'
  },
  2: {
    id: 2,
    problemType: 'translation',
    originalFunction: 'x^2',
    targetFunction: 'x^2+3',
    transformType: 'translation_vertical',
    transformParams: { k: 3, direction: 'up' },
    difficulty: 'easy',
    description: '함수 f(x) = x²를 위로 3만큼 이동시킨 그래프를 관찰하세요.',
    hints: [
      '평행이동 공식: f(x)+k는 위로 k만큼 이동합니다.',
      'k = 3을 적용하면 f(x)+3 = x²+3이 됩니다.'
    ],
    createdAt: '2025-11-18T00:00:00Z',
    updatedAt: '2025-11-18T00:00:00Z'
  },
  3: {
    id: 3,
    problemType: 'translation',
    originalFunction: 'x^2',
    targetFunction: '(x-1)^2+2',
    transformType: 'translation_combined',
    transformParams: { h: 1, k: 2 },
    difficulty: 'medium',
    description: '함수 f(x) = x²를 오른쪽으로 1, 위로 2만큼 이동시킨 그래프를 관찰하세요.',
    hints: [
      '평행이동 공식: f(x-h)+k',
      'h = 1, k = 2를 적용하면 (x-1)²+2가 됩니다.'
    ],
    createdAt: '2025-11-18T00:00:00Z',
    updatedAt: '2025-11-18T00:00:00Z'
  },
  4: {
    id: 4,
    problemType: 'reflection',
    originalFunction: 'x^2',
    targetFunction: '-x^2',
    transformType: 'reflection_x',
    transformParams: { axis: 'x' },
    difficulty: 'easy',
    description: '함수 f(x) = x²를 x축에 대해 대칭이동시킨 그래프를 관찰하세요.',
    hints: [
      'x축 대칭 공식: -f(x)',
      'f(x) = x²이므로 -f(x) = -x²입니다.'
    ],
    createdAt: '2025-11-18T00:00:00Z',
    updatedAt: '2025-11-18T00:00:00Z'
  },
  5: {
    id: 5,
    problemType: 'reflection',
    originalFunction: 'x^3',
    targetFunction: '(-x)^3',
    transformType: 'reflection_y',
    transformParams: { axis: 'y' },
    difficulty: 'easy',
    description: '함수 f(x) = x³를 y축에 대해 대칭이동시킨 그래프를 관찰하세요.',
    hints: [
      'y축 대칭 공식: f(-x)',
      'f(x) = x³이므로 f(-x) = (-x)³ = -x³입니다.'
    ],
    createdAt: '2025-11-18T00:00:00Z',
    updatedAt: '2025-11-18T00:00:00Z'
  },
  6: {
    id: 6,
    problemType: 'scaling',
    originalFunction: 'x^2',
    targetFunction: '2*x^2',
    transformType: 'scaling_vertical',
    transformParams: { a: 2 },
    difficulty: 'medium',
    description: '함수 f(x) = x²를 y축 방향으로 2배 확대한 그래프를 관찰하세요.',
    hints: [
      '수직 확대 공식: a·f(x)',
      'a = 2를 적용하면 2·f(x) = 2x²입니다.'
    ],
    createdAt: '2025-11-18T00:00:00Z',
    updatedAt: '2025-11-18T00:00:00Z'
  },
  7: {
    id: 7,
    problemType: 'combination',
    originalFunction: 'x^2',
    targetFunction: '2*(x-1)^2+3',
    transformType: 'combination',
    transformParams: { a: 2, h: 1, k: 3 },
    difficulty: 'hard',
    description: '함수 f(x) = x²에 여러 변환을 적용: 오른쪽 1, 위 3, y축 방향 2배',
    hints: [
      '변환 순서: 평행이동 → 확대/축소',
      '최종 형태: a·f(x-h)+k = 2(x-1)²+3'
    ],
    createdAt: '2025-11-18T00:00:00Z',
    updatedAt: '2025-11-18T00:00:00Z'
  }
};

// 학생 진행 상황 Mock 데이터
const mockProgress = {
  123: {
    studentId: 123,
    totalAttempts: 15,
    correctAnswers: 12,
    accuracyRate: 80.00
  }
};

/**
 * Mock API 응답 지연 시뮬레이션
 */
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock API 함수들
 */
export const mockApi = {
  /**
   * 문제 데이터 가져오기
   */
  getProblem: async (problemId) => {
    await delay(300);

    const problem = mockProblems[problemId];

    if (!problem) {
      return {
        success: false,
        error: 'Problem not found',
        message: '문제를 찾을 수 없습니다.'
      };
    }

    return {
      success: true,
      data: problem
    };
  },

  /**
   * 답안 저장
   */
  saveAnswer: async (studentId, problemId, answer, isCorrect) => {
    await delay(200);

    console.log('Mock API: Saving answer', {
      studentId,
      problemId,
      answer,
      isCorrect
    });

    return {
      success: true,
      data: {
        answerId: Math.floor(Math.random() * 10000),
        message: '답안이 저장되었습니다.'
      }
    };
  },

  /**
   * 학생 진행 상황 가져오기
   */
  getProgress: async (studentId, courseId = null) => {
    await delay(300);

    const progress = mockProgress[studentId] || {
      studentId: studentId,
      totalAttempts: 0,
      correctAnswers: 0,
      accuracyRate: 0.00
    };

    return {
      success: true,
      data: progress
    };
  },

  /**
   * 모든 문제 목록 가져오기
   */
  getAllProblems: async () => {
    await delay(300);

    return {
      success: true,
      data: Object.values(mockProblems)
    };
  }
};

/**
 * API 호출 래퍼 - 환경 변수에 따라 Mock 또는 실제 API 사용
 */
export const apiCall = async (endpoint, options = {}) => {
  const useMockApi = process.env.REACT_APP_MOCK_API === 'true';

  if (useMockApi) {
    console.log('🎭 Using Mock API:', endpoint);

    // URL에서 액션 파싱
    const url = new URL(endpoint, 'http://localhost');
    const action = url.searchParams.get('action');
    const id = url.searchParams.get('id');

    switch (action) {
      case 'get_problem':
        return mockApi.getProblem(parseInt(id));

      case 'save_answer':
        const body = JSON.parse(options.body || '{}');
        return mockApi.saveAnswer(
          body.studentId,
          body.problemId,
          body.answer,
          body.isCorrect
        );

      case 'get_progress':
        const studentId = url.searchParams.get('student_id');
        const courseId = url.searchParams.get('course_id');
        return mockApi.getProgress(parseInt(studentId), courseId);

      default:
        return {
          success: false,
          error: 'Invalid action',
          message: '유효하지 않은 작업입니다.'
        };
    }
  } else {
    // 실제 API 호출
    console.log('🌐 Using Real API:', endpoint);
    const response = await fetch(endpoint, options);
    return response.json();
  }
};

export default mockApi;
