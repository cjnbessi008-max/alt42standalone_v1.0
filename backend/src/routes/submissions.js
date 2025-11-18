import express from 'express';
import {
  submitAnswer,
  getSubmissionById,
  getSubmissionsByStudent,
  getSubmissionsByProblem
} from '../controllers/submissionController.js';

const router = express.Router();

// POST /api/submissions - Submit an answer
router.post('/', submitAnswer);

// GET /api/submissions/:id - Get specific submission
router.get('/:id', getSubmissionById);

// GET /api/submissions/student/:studentId - Get all submissions by student
router.get('/student/:studentId', getSubmissionsByStudent);

// GET /api/submissions/problem/:problemId - Get all submissions for a problem
router.get('/problem/:problemId', getSubmissionsByProblem);

export default router;
