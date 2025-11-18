import { Problem } from '../types';

export const sampleProblems: Problem[] = [
  {
    id: 1,
    question: '3 + 5는 얼마일까요?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 2,
    explanation: '3과 5를 더하면 8이 됩니다.'
  },
  {
    id: 2,
    question: '12 - 7은 얼마일까요?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 2,
    explanation: '12에서 7을 빼면 5가 됩니다.'
  },
  {
    id: 3,
    question: '4 × 6은 얼마일까요?',
    options: ['20', '22', '24', '26'],
    correctAnswer: 2,
    explanation: '4에 6을 곱하면 24가 됩니다.'
  },
  {
    id: 4,
    question: '15 ÷ 3은 얼마일까요?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 2,
    explanation: '15를 3으로 나누면 5가 됩니다.'
  },
  {
    id: 5,
    question: '(2 + 3) × 4는 얼마일까요?',
    options: ['14', '18', '20', '24'],
    correctAnswer: 2,
    explanation: '괄호 안을 먼저 계산하면 5이고, 5 × 4 = 20입니다.'
  }
];
