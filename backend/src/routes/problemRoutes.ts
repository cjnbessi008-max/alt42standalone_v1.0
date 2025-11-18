import { Router } from 'express';
import { problemController } from '../controllers/problemController.js';

const router = Router();

// GET /api/problems - 모든 문제 조회
router.get('/', problemController.getAllProblems);

// GET /api/problems/random - 랜덤 문제 조회
router.get('/random', problemController.getRandomProblem);

// GET /api/problems/stats - 통계 조회
router.get('/stats', problemController.getStatistics);

// GET /api/problems/:id - 특정 문제 조회
router.get('/:id', problemController.getProblemById);

// POST /api/problems/:id/answer - 답안 제출
router.post('/:id/answer', problemController.submitAnswer);

export default router;
