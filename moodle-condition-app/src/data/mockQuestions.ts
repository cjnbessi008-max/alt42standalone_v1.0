import type { MoodleQuestion } from '../types/moodle';

/**
 * Mock Moodle Questions Data
 * Simulates data from Moodle LMS
 */
export const mockQuestions: MoodleQuestion[] = [
  {
    id: 1,
    name: '분수의 덧셈',
    questionText: '1/2 + 1/4 = ?',
    type: 'numerical',
    difficulty: 'easy',
    status: 'completed',
    maxScore: 10,
    currentScore: 10,
    attempts: 1,
    maxAttempts: 3,
    timeSpent: 45,
    category: '수학 > 분수',
    tags: ['분수', '덧셈', '초등 3학년'],
    createdAt: '2025-11-01T09:00:00Z',
    updatedAt: '2025-11-15T14:30:00Z',
  },
  {
    id: 2,
    name: '도형의 넓이',
    questionText: '가로 5cm, 세로 3cm인 직사각형의 넓이를 구하시오.',
    type: 'multichoice',
    difficulty: 'easy',
    status: 'completed',
    maxScore: 10,
    currentScore: 8,
    attempts: 2,
    maxAttempts: 3,
    timeSpent: 120,
    category: '수학 > 도형',
    tags: ['도형', '넓이', '직사각형'],
    createdAt: '2025-11-02T10:00:00Z',
    updatedAt: '2025-11-16T10:15:00Z',
  },
  {
    id: 3,
    name: '방정식 풀이',
    questionText: '2x + 5 = 15 일 때, x의 값을 구하시오.',
    type: 'shortanswer',
    difficulty: 'medium',
    status: 'in_progress',
    maxScore: 15,
    currentScore: 0,
    attempts: 1,
    maxAttempts: 3,
    timeSpent: 180,
    category: '수학 > 방정식',
    tags: ['방정식', '대수', '중등 1학년'],
    createdAt: '2025-11-03T11:00:00Z',
    updatedAt: '2025-11-17T09:45:00Z',
  },
  {
    id: 4,
    name: '피타고라스 정리',
    questionText: '직각삼각형에서 빗변의 길이를 구하는 공식을 설명하시오.',
    type: 'essay',
    difficulty: 'hard',
    status: 'not_started',
    maxScore: 20,
    attempts: 0,
    maxAttempts: 2,
    timeSpent: 0,
    category: '수학 > 기하',
    tags: ['피타고라스', '정리', '기하학'],
    createdAt: '2025-11-04T13:00:00Z',
    updatedAt: '2025-11-04T13:00:00Z',
  },
  {
    id: 5,
    name: '소수 판별',
    questionText: '17은 소수인가요?',
    type: 'truefalse',
    difficulty: 'easy',
    status: 'completed',
    maxScore: 5,
    currentScore: 5,
    attempts: 1,
    maxAttempts: 1,
    timeSpent: 15,
    category: '수학 > 정수',
    tags: ['소수', '정수론'],
    createdAt: '2025-11-05T14:00:00Z',
    updatedAt: '2025-11-16T11:20:00Z',
  },
  {
    id: 6,
    name: '비율 계산',
    questionText: '24의 25%는 얼마인가요?',
    type: 'numerical',
    difficulty: 'medium',
    status: 'in_progress',
    maxScore: 12,
    currentScore: 0,
    attempts: 2,
    maxAttempts: 3,
    timeSpent: 240,
    category: '수학 > 비율',
    tags: ['비율', '퍼센트', '백분율'],
    createdAt: '2025-11-06T15:00:00Z',
    updatedAt: '2025-11-18T08:30:00Z',
  },
  {
    id: 7,
    name: '삼각함수 기초',
    questionText: 'sin(30°)의 값은 무엇인가요?',
    type: 'multichoice',
    difficulty: 'hard',
    status: 'not_started',
    maxScore: 18,
    attempts: 0,
    maxAttempts: 3,
    timeSpent: 0,
    category: '수학 > 삼각함수',
    tags: ['삼각함수', 'sin', '각도'],
    createdAt: '2025-11-07T16:00:00Z',
    updatedAt: '2025-11-07T16:00:00Z',
  },
  {
    id: 8,
    name: '확률 문제',
    questionText: '주사위를 던졌을 때 짝수가 나올 확률은?',
    type: 'shortanswer',
    difficulty: 'medium',
    status: 'completed',
    maxScore: 10,
    currentScore: 10,
    attempts: 1,
    maxAttempts: 3,
    timeSpent: 90,
    category: '수학 > 확률',
    tags: ['확률', '통계', '주사위'],
    createdAt: '2025-11-08T09:30:00Z',
    updatedAt: '2025-11-17T15:45:00Z',
  },
];

/**
 * Simulates fetching questions from Moodle API
 */
export const fetchMoodleQuestions = async (): Promise<MoodleQuestion[]> => {
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockQuestions);
    }, 500);
  });
};

/**
 * Get question by ID
 */
export const getQuestionById = (id: number): MoodleQuestion | undefined => {
  return mockQuestions.find((q) => q.id === id);
};
