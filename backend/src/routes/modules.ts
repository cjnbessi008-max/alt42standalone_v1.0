/**
 * Module/Content API routes
 */

import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/modules
 * Get available modules
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const modules = [
      {
        id: 'module-fractions-01',
        name: '분수의 이해',
        description: '분수의 기본 개념과 연산을 학습합니다',
        subject: 'mathematics',
        gradeLevel: '초등 4학년',
        conceptCount: 3,
      },
      {
        id: 'module-algebra-01',
        name: '대수학 기초',
        description: '변수와 방정식의 기본 개념을 학습합니다',
        subject: 'mathematics',
        gradeLevel: '중등 1학년',
        conceptCount: 5,
      },
    ];

    res.json(modules);
  } catch (error) {
    console.error('Error getting modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/modules/:moduleId
 * Get module details
 */
router.get('/:moduleId', (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;

    const module = {
      id: moduleId,
      name: '분수의 이해',
      description: '분수의 기본 개념과 연산을 학습합니다',
      concepts: [
        { id: 'concept-001', name: '분수의 덧셈', difficulty: 1 },
        { id: 'concept-002', name: '분수의 뺄셈', difficulty: 2 },
        { id: 'concept-003', name: '분수의 곱셈', difficulty: 2 },
      ],
    };

    res.json(module);
  } catch (error) {
    console.error('Error getting module details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/modules/:moduleId/submit
 * Submit problem answer
 */
router.post('/:moduleId/submit', (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const { problemId, answer } = req.body;

    // Mock answer checking
    const correct = Math.random() > 0.3; // 70% correct rate

    res.json({
      correct,
      feedback: correct
        ? '정답입니다! 잘하셨어요.'
        : '아쉽게도 틀렸습니다. 다시 한 번 생각해보세요.',
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
