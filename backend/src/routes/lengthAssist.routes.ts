// Length Assist API Routes

import { Router } from 'express';
import lengthAssistController from '../controllers/lengthAssistController.js';

const router = Router();

// GET /api/length-assist/problems - Get problems list
router.get('/problems', lengthAssistController.getProblems.bind(lengthAssistController));

// GET /api/length-assist/problems/:id - Get specific problem
router.get('/problems/:id', lengthAssistController.getProblem.bind(lengthAssistController));

// POST /api/length-assist/next-problem - Get next problem for student
router.post('/next-problem', lengthAssistController.getNextProblem.bind(lengthAssistController));

// POST /api/length-assist/submit - Submit answer
router.post('/submit', lengthAssistController.submitAnswer.bind(lengthAssistController));

// GET /api/length-assist/progress/:studentId - Get student progress
router.get('/progress/:studentId', lengthAssistController.getProgress.bind(lengthAssistController));

export default router;
