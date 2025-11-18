export interface Problem {
  id: number;
  functionExpression: string;
  domain: [number, number];
  point: number;
  questionType: 'derivative' | 'inverse_derivative' | 'both';
  moodleQuestionId?: number;
  createdAt?: Date;
}

export interface StudentProgress {
  id?: number;
  studentId: number;
  problemId: number;
  attempts: number;
  completed: boolean;
  score: number;
  timeSpent: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const sampleProblems: Problem[] = [
  {
    id: 1,
    functionExpression: 'x^2',
    domain: [0, 3],
    point: 1.5,
    questionType: 'both',
  },
  {
    id: 2,
    functionExpression: 'sqrt(x)',
    domain: [0, 4],
    point: 2,
    questionType: 'both',
  },
  {
    id: 3,
    functionExpression: 'exp(x)',
    domain: [-2, 2],
    point: 1,
    questionType: 'both',
  },
  {
    id: 4,
    functionExpression: 'x^3',
    domain: [-2, 2],
    point: 1,
    questionType: 'derivative',
  },
  {
    id: 5,
    functionExpression: 'sin(x)',
    domain: [-1.5, 1.5],
    point: 0.5,
    questionType: 'both',
  },
];
