import type { Problem } from '../types';

/**
 * LMS Mock 데이터
 * 실제 환경에서는 Moodle API에서 가져옵니다
 */
export const mockProblems: Problem[] = [
  {
    id: 'prob-001',
    title: '이차함수의 미분',
    description: 'f(x) = x² + 2x + 1 함수를 미분하세요',
    function: {
      id: 'func-001',
      expression: 'x^2 + 2*x + 1',
      label: 'f(x) = x² + 2x + 1',
      color: '#4f46e5',
    },
    difficulty: 'easy',
    hints: [
      '미분 버튼을 눌러보세요',
      '그래프가 어떻게 변하는지 관찰하세요',
    ],
  },
  {
    id: 'prob-002',
    title: '삼차함수의 미분',
    description: 'f(x) = x³ - 3x² + 2x 함수를 미분하세요',
    function: {
      id: 'func-002',
      expression: 'x^3 - 3*x^2 + 2*x',
      label: 'f(x) = x³ - 3x² + 2x',
      color: '#059669',
    },
    difficulty: 'medium',
    hints: [
      '삼차함수를 미분하면 이차함수가 됩니다',
      'Derivative Pulse 애니메이션을 주목하세요',
    ],
  },
  {
    id: 'prob-003',
    title: '삼각함수의 미분',
    description: 'f(x) = sin(x) + cos(x) 함수를 미분하세요',
    function: {
      id: 'func-003',
      expression: 'sin(x) + cos(x)',
      label: 'f(x) = sin(x) + cos(x)',
      color: '#dc2626',
    },
    difficulty: 'hard',
    hints: [
      'sin(x)의 미분은 cos(x)입니다',
      'cos(x)의 미분은 -sin(x)입니다',
    ],
  },
];

/**
 * LMS에서 문제를 가져옵니다 (Mock)
 */
export async function fetchProblemFromLMS(problemId?: string): Promise<Problem> {
  // 실제 구현에서는 Moodle API 호출
  // await fetch('http://moodle.example.com/api/problem/' + problemId)

  return new Promise((resolve) => {
    setTimeout(() => {
      const problem = problemId
        ? mockProblems.find(p => p.id === problemId) || mockProblems[0]
        : mockProblems[Math.floor(Math.random() * mockProblems.length)];
      resolve(problem);
    }, 500); // 네트워크 지연 시뮬레이션
  });
}

/**
 * LMS에 학생 답안을 제출합니다 (Mock)
 */
export async function submitAnswerToLMS(
  _problemId: string,
  _studentAnswer: string
): Promise<{ correct: boolean; feedback: string }> {
  // 실제 구현에서는 Moodle API 호출
  // const response = await fetch(`/api/submit`, {
  //   method: 'POST',
  //   body: JSON.stringify({ problemId: _problemId, answer: _studentAnswer })
  // });

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        correct: true, // Mock이므로 항상 정답 처리
        feedback: '훌륭합니다! 미분을 정확히 이해하셨네요.',
      });
    }, 300);
  });
}
