import express from 'express';
import {
  submitMatch,
  getStudentProgress,
  getStudentResponses
} from '../controllers/matchingController.js';

const router = express.Router();

// POST submit a matching answer
router.post('/submit', submitMatch);

// GET student progress for a specific problem
router.get('/progress/:studentId/:problemId', getStudentProgress);

// GET all responses for a student
router.get('/responses/:studentId', getStudentResponses);

export default router;
