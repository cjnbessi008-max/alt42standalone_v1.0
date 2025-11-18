import { Question } from '../types';

export const sampleQuestions: Question[] = [
  {
    id: 'q1',
    type: 'multiple-choice',
    difficulty: 'easy',
    title: '분수의 기초',
    question: '1/2 + 1/4는 무엇인가요?',
    options: ['1/6', '2/6', '3/4', '1/3'],
    correctAnswer: 2, // 3/4
    explanation: '분모를 4로 통일하면: 2/4 + 1/4 = 3/4입니다.',
    category: '분수',
    timeLimit: 60
  },
  {
    id: 'q2',
    type: 'multiple-choice',
    difficulty: 'easy',
    title: '곱셈 구구단',
    question: '7 × 8은 무엇인가요?',
    options: ['54', '56', '48', '64'],
    correctAnswer: 1, // 56
    explanation: '7 × 8 = 56입니다.',
    category: '곱셈',
    timeLimit: 30
  },
  {
    id: 'q3',
    type: 'true-false',
    difficulty: 'easy',
    title: '짝수와 홀수',
    question: '15는 짝수이다.',
    correctAnswer: 0, // false
    explanation: '15는 2로 나누어떨어지지 않으므로 홀수입니다.',
    category: '수의 성질',
    timeLimit: 20
  },
  {
    id: 'q4',
    type: 'multiple-choice',
    difficulty: 'medium',
    title: '소수의 이해',
    question: '다음 중 소수가 아닌 것은?',
    options: ['2', '9', '11', '13'],
    correctAnswer: 1, // 9
    explanation: '9는 1과 9 외에 3으로도 나누어떨어지므로 소수가 아닙니다.',
    category: '수의 성질',
    timeLimit: 45
  },
  {
    id: 'q5',
    type: 'multiple-choice',
    difficulty: 'medium',
    title: '넓이 구하기',
    question: '가로 8cm, 세로 5cm인 직사각형의 넓이는?',
    options: ['13 cm²', '26 cm²', '40 cm²', '45 cm²'],
    correctAnswer: 2, // 40
    explanation: '직사각형의 넓이 = 가로 × 세로 = 8 × 5 = 40 cm²입니다.',
    category: '도형',
    timeLimit: 60
  },
  {
    id: 'q6',
    type: 'multiple-choice',
    difficulty: 'medium',
    title: '평균 구하기',
    question: '80, 90, 70, 100점의 평균은?',
    options: ['80점', '85점', '90점', '95점'],
    correctAnswer: 1, // 85
    explanation: '평균 = (80 + 90 + 70 + 100) ÷ 4 = 340 ÷ 4 = 85점입니다.',
    category: '통계',
    timeLimit: 60
  },
  {
    id: 'q7',
    type: 'true-false',
    difficulty: 'medium',
    title: '원의 성질',
    question: '원의 둘레는 지름 × 3.14이다.',
    correctAnswer: 1, // true
    explanation: '원주 = 지름 × π (원주율, 약 3.14)입니다.',
    category: '도형',
    timeLimit: 30
  },
  {
    id: 'q8',
    type: 'multiple-choice',
    difficulty: 'hard',
    title: '비율과 백분율',
    question: '원래 가격 20,000원의 물건을 15% 할인하면 얼마인가요?',
    options: ['15,000원', '17,000원', '18,000원', '19,000원'],
    correctAnswer: 1, // 17,000
    explanation: '할인 금액 = 20,000 × 0.15 = 3,000원. 최종 가격 = 20,000 - 3,000 = 17,000원입니다.',
    category: '비율',
    timeLimit: 90
  },
  {
    id: 'q9',
    type: 'multiple-choice',
    difficulty: 'hard',
    title: '약수와 배수',
    question: '12와 18의 최대공약수는?',
    options: ['2', '3', '6', '9'],
    correctAnswer: 2, // 6
    explanation: '12의 약수: 1, 2, 3, 4, 6, 12 / 18의 약수: 1, 2, 3, 6, 9, 18 / 공약수 중 가장 큰 수는 6입니다.',
    category: '수의 성질',
    timeLimit: 90
  },
  {
    id: 'q10',
    type: 'multiple-choice',
    difficulty: 'hard',
    title: '속력 계산',
    question: '시속 60km로 2.5시간 달린 거리는?',
    options: ['120 km', '130 km', '140 km', '150 km'],
    correctAnswer: 3, // 150
    explanation: '거리 = 속력 × 시간 = 60 × 2.5 = 150 km입니다.',
    category: '측정',
    timeLimit: 90
  }
];
