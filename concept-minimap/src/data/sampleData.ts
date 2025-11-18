import { Concept, Problem, ConceptTreeData, LMSData } from '../types/concept';

/**
 * 샘플 개념 트리 데이터 - 분수를 중심으로 한 수학 개념 계층 구조
 */

export const sampleConcepts: Record<string, Concept> = {
  // Level 0: 최상위 개념
  'math-basics': {
    id: 'math-basics',
    name: '수학 기초',
    description: '기본적인 수학 개념',
    level: 0,
    difficulty: 'beginner',
    prerequisites: [],
    children: ['numbers', 'operations'],
    learningProgress: 100,
    isLocked: false,
  },

  // Level 1
  'numbers': {
    id: 'numbers',
    name: '수의 개념',
    description: '여러 종류의 수 이해하기',
    level: 1,
    difficulty: 'beginner',
    prerequisites: ['math-basics'],
    children: ['natural-numbers', 'fractions', 'decimals'],
    learningProgress: 90,
    isLocked: false,
  },

  'operations': {
    id: 'operations',
    name: '사칙연산',
    description: '덧셈, 뺄셈, 곱셈, 나눗셈',
    level: 1,
    difficulty: 'beginner',
    prerequisites: ['math-basics'],
    children: ['addition', 'subtraction', 'multiplication', 'division'],
    learningProgress: 85,
    isLocked: false,
  },

  // Level 2
  'natural-numbers': {
    id: 'natural-numbers',
    name: '자연수',
    description: '1, 2, 3과 같은 자연수',
    level: 2,
    difficulty: 'beginner',
    prerequisites: ['numbers'],
    children: [],
    learningProgress: 100,
    isLocked: false,
  },

  'fractions': {
    id: 'fractions',
    name: '분수',
    description: '부분을 나타내는 수',
    level: 2,
    difficulty: 'intermediate',
    prerequisites: ['numbers', 'division'],
    children: ['fraction-basics', 'fraction-operations', 'fraction-types'],
    learningProgress: 60,
    isLocked: false,
  },

  'decimals': {
    id: 'decimals',
    name: '소수',
    description: '소수점이 있는 수',
    level: 2,
    difficulty: 'intermediate',
    prerequisites: ['numbers', 'fractions'],
    children: [],
    learningProgress: 30,
    isLocked: false,
  },

  'addition': {
    id: 'addition',
    name: '덧셈',
    description: '수를 더하는 연산',
    level: 2,
    difficulty: 'beginner',
    prerequisites: ['operations'],
    children: [],
    learningProgress: 100,
    isLocked: false,
  },

  'subtraction': {
    id: 'subtraction',
    name: '뺄셈',
    description: '수를 빼는 연산',
    level: 2,
    difficulty: 'beginner',
    prerequisites: ['operations'],
    children: [],
    learningProgress: 100,
    isLocked: false,
  },

  'multiplication': {
    id: 'multiplication',
    name: '곱셈',
    description: '수를 곱하는 연산',
    level: 2,
    difficulty: 'intermediate',
    prerequisites: ['operations', 'addition'],
    children: [],
    learningProgress: 95,
    isLocked: false,
  },

  'division': {
    id: 'division',
    name: '나눗셈',
    description: '수를 나누는 연산',
    level: 2,
    difficulty: 'intermediate',
    prerequisites: ['operations', 'multiplication'],
    children: [],
    learningProgress: 80,
    isLocked: false,
  },

  // Level 3: 분수 관련 상세 개념
  'fraction-basics': {
    id: 'fraction-basics',
    name: '분수의 기본',
    description: '분자, 분모, 분수의 의미',
    level: 3,
    difficulty: 'intermediate',
    prerequisites: ['fractions'],
    children: ['numerator-denominator', 'fraction-visualization'],
    learningProgress: 80,
    isLocked: false,
  },

  'fraction-types': {
    id: 'fraction-types',
    name: '분수의 종류',
    description: '진분수, 가분수, 대분수',
    level: 3,
    difficulty: 'intermediate',
    prerequisites: ['fractions'],
    children: ['proper-fractions', 'improper-fractions', 'mixed-numbers'],
    learningProgress: 70,
    isLocked: false,
  },

  'fraction-operations': {
    id: 'fraction-operations',
    name: '분수의 연산',
    description: '분수의 덧셈, 뺄셈, 곱셈, 나눗셈',
    level: 3,
    difficulty: 'advanced',
    prerequisites: ['fractions', 'fraction-basics'],
    children: ['fraction-addition', 'fraction-subtraction', 'fraction-multiplication', 'fraction-division'],
    learningProgress: 40,
    isLocked: false,
  },

  // Level 4: 분수 세부 개념
  'numerator-denominator': {
    id: 'numerator-denominator',
    name: '분자와 분모',
    description: '분수의 구성 요소 이해',
    level: 4,
    difficulty: 'intermediate',
    prerequisites: ['fraction-basics'],
    children: [],
    learningProgress: 100,
    isLocked: false,
  },

  'fraction-visualization': {
    id: 'fraction-visualization',
    name: '분수의 시각화',
    description: '파이 차트, 막대 등으로 분수 표현',
    level: 4,
    difficulty: 'intermediate',
    prerequisites: ['fraction-basics'],
    children: [],
    learningProgress: 90,
    isLocked: false,
  },

  'proper-fractions': {
    id: 'proper-fractions',
    name: '진분수',
    description: '분자가 분모보다 작은 분수',
    level: 4,
    difficulty: 'intermediate',
    prerequisites: ['fraction-types'],
    children: [],
    learningProgress: 85,
    isLocked: false,
  },

  'improper-fractions': {
    id: 'improper-fractions',
    name: '가분수',
    description: '분자가 분모보다 크거나 같은 분수',
    level: 4,
    difficulty: 'intermediate',
    prerequisites: ['fraction-types'],
    children: [],
    learningProgress: 75,
    isLocked: false,
  },

  'mixed-numbers': {
    id: 'mixed-numbers',
    name: '대분수',
    description: '자연수와 진분수의 합',
    level: 4,
    difficulty: 'intermediate',
    prerequisites: ['fraction-types', 'improper-fractions'],
    children: [],
    learningProgress: 60,
    isLocked: false,
  },

  'fraction-addition': {
    id: 'fraction-addition',
    name: '분수의 덧셈',
    description: '분수를 더하는 방법',
    level: 4,
    difficulty: 'advanced',
    prerequisites: ['fraction-operations', 'addition'],
    children: ['same-denominator-add', 'different-denominator-add'],
    learningProgress: 50,
    isLocked: false,
  },

  'fraction-subtraction': {
    id: 'fraction-subtraction',
    name: '분수의 뺄셈',
    description: '분수를 빼는 방법',
    level: 4,
    difficulty: 'advanced',
    prerequisites: ['fraction-operations', 'subtraction'],
    children: [],
    learningProgress: 30,
    isLocked: false,
  },

  'fraction-multiplication': {
    id: 'fraction-multiplication',
    name: '분수의 곱셈',
    description: '분수를 곱하는 방법',
    level: 4,
    difficulty: 'advanced',
    prerequisites: ['fraction-operations', 'multiplication'],
    children: [],
    learningProgress: 20,
    isLocked: true,
  },

  'fraction-division': {
    id: 'fraction-division',
    name: '분수의 나눗셈',
    description: '분수를 나누는 방법',
    level: 4,
    difficulty: 'advanced',
    prerequisites: ['fraction-operations', 'division', 'fraction-multiplication'],
    children: [],
    learningProgress: 0,
    isLocked: true,
  },

  // Level 5: 분수 덧셈 세부
  'same-denominator-add': {
    id: 'same-denominator-add',
    name: '같은 분모 덧셈',
    description: '분모가 같은 분수의 덧셈',
    level: 5,
    difficulty: 'advanced',
    prerequisites: ['fraction-addition'],
    children: [],
    learningProgress: 60,
    isLocked: false,
  },

  'different-denominator-add': {
    id: 'different-denominator-add',
    name: '다른 분모 덧셈',
    description: '분모가 다른 분수의 덧셈 (통분)',
    level: 5,
    difficulty: 'advanced',
    prerequisites: ['fraction-addition', 'same-denominator-add'],
    children: ['lcm-concept', 'common-denominator'],
    learningProgress: 40,
    isLocked: false,
  },

  // Level 6: 통분 관련
  'lcm-concept': {
    id: 'lcm-concept',
    name: '최소공배수',
    description: '최소공배수의 개념과 구하기',
    level: 6,
    difficulty: 'advanced',
    prerequisites: ['different-denominator-add'],
    children: [],
    learningProgress: 50,
    isLocked: false,
  },

  'common-denominator': {
    id: 'common-denominator',
    name: '통분',
    description: '분모를 같게 만들기',
    level: 6,
    difficulty: 'advanced',
    prerequisites: ['different-denominator-add', 'lcm-concept'],
    children: [],
    learningProgress: 45,
    isLocked: false,
  },
};

export const conceptTreeData: ConceptTreeData = {
  concepts: sampleConcepts,
  rootConceptId: 'math-basics',
};

/**
 * 샘플 문제 데이터
 */
export const sampleProblems: Problem[] = [
  {
    id: 'prob-001',
    title: '다른 분모 덧셈 문제',
    description: '분모가 다른 두 분수를 더하는 문제',
    difficulty: 'medium',
    mainConceptId: 'different-denominator-add',
    relatedConceptIds: [
      'different-denominator-add',
      'common-denominator',
      'lcm-concept',
      'same-denominator-add',
      'fraction-addition',
      'fraction-operations',
      'fractions',
    ],
    content: `다음 분수의 덧셈을 계산하세요:

1/3 + 1/4 = ?

힌트: 분모를 같게 만든 후 계산하세요.`,
    solution: `1. 최소공배수 구하기: 3과 4의 최소공배수는 12
2. 통분하기: 1/3 = 4/12, 1/4 = 3/12
3. 분자끼리 더하기: 4/12 + 3/12 = 7/12

답: 7/12`,
  },
  {
    id: 'prob-002',
    title: '같은 분모 덧셈 문제',
    description: '분모가 같은 두 분수를 더하는 문제',
    difficulty: 'easy',
    mainConceptId: 'same-denominator-add',
    relatedConceptIds: [
      'same-denominator-add',
      'fraction-addition',
      'fraction-operations',
      'fractions',
    ],
    content: `다음 분수의 덧셈을 계산하세요:

2/5 + 1/5 = ?`,
    solution: `분모가 같으므로 분자끼리만 더합니다:
2/5 + 1/5 = (2+1)/5 = 3/5

답: 3/5`,
  },
  {
    id: 'prob-003',
    title: '최소공배수 구하기',
    description: '두 수의 최소공배수를 구하는 문제',
    difficulty: 'medium',
    mainConceptId: 'lcm-concept',
    relatedConceptIds: ['lcm-concept', 'different-denominator-add'],
    content: `6과 8의 최소공배수를 구하세요.`,
    solution: `6의 배수: 6, 12, 18, 24, 30...
8의 배수: 8, 16, 24, 32...

공통으로 나타나는 가장 작은 수는 24입니다.

답: 24`,
  },
];

/**
 * LMS 시뮬레이션 데이터
 */
export const sampleLMSData: LMSData = {
  currentProblem: sampleProblems[0], // "다른 분모 덧셈 문제"
  studentProgress: {
    'math-basics': 100,
    'numbers': 90,
    'operations': 85,
    'natural-numbers': 100,
    'fractions': 60,
    'decimals': 30,
    'addition': 100,
    'subtraction': 100,
    'multiplication': 95,
    'division': 80,
    'fraction-basics': 80,
    'fraction-types': 70,
    'fraction-operations': 40,
    'numerator-denominator': 100,
    'fraction-visualization': 90,
    'proper-fractions': 85,
    'improper-fractions': 75,
    'mixed-numbers': 60,
    'fraction-addition': 50,
    'fraction-subtraction': 30,
    'fraction-multiplication': 20,
    'fraction-division': 0,
    'same-denominator-add': 60,
    'different-denominator-add': 40,
    'lcm-concept': 50,
    'common-denominator': 45,
  },
  completedConcepts: [
    'math-basics',
    'natural-numbers',
    'addition',
    'subtraction',
    'numerator-denominator',
    'fraction-visualization',
  ],
};
