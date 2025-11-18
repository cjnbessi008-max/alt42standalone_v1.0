import express from 'express';
import type { Question, ApiResponse } from '../../../shared/types.js';

const router = express.Router();

// In-memory storage (replace with database later)
const questions: Question[] = [
  {
    id: 'q1',
    title: '범위 문제 예시',
    content: '10부터 20까지의 정수 중에서 3의 배수를 모두 찾으시오. 답의 범위는 [10, 20]입니다.',
    type: 'numerical',
    difficulty: 'easy',
    metadata: {
      subject: 'mathematics',
      topic: 'multiples',
      tags: ['range', 'integers', 'multiples']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'q2',
    title: '시간 범위 문제',
    content: '학생은 매일 1시간에서 2시간 사이의 시간을 공부해야 합니다. 일주일 동안 총 공부 시간의 범위를 구하시오.',
    type: 'range_based',
    difficulty: 'medium',
    metadata: {
      subject: 'mathematics',
      topic: 'time_calculation',
      tags: ['time', 'range', 'calculation']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// GET /api/questions - Get all questions
router.get('/', (req, res) => {
  const response: ApiResponse<Question[]> = {
    success: true,
    data: questions,
    timestamp: new Date().toISOString()
  };
  res.json(response);
});

// GET /api/questions/:id - Get specific question
router.get('/:id', (req, res) => {
  const question = questions.find(q => q.id === req.params.id);

  if (!question) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Question not found',
      timestamp: new Date().toISOString()
    };
    return res.status(404).json(response);
  }

  const response: ApiResponse<Question> = {
    success: true,
    data: question,
    timestamp: new Date().toISOString()
  };
  res.json(response);
});

// POST /api/questions - Create new question (for testing)
router.post('/', (req, res) => {
  const newQuestion: Question = {
    id: `q${questions.length + 1}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  questions.push(newQuestion);

  const response: ApiResponse<Question> = {
    success: true,
    data: newQuestion,
    timestamp: new Date().toISOString()
  };
  res.status(201).json(response);
});

export default router;
