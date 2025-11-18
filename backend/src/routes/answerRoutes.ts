import { Router } from 'express';
import {
  submitAnswer,
  getStudentAnswers,
} from '../controllers/answerController';

const router = Router();

/**
 * @route   POST /api/answers/submit
 * @desc    Submit student answer for evaluation
 * @access  Public
 */
router.post('/submit', submitAnswer);

/**
 * @route   GET /api/answers/:studentId/:problemId
 * @desc    Get student's answer history for a problem
 * @access  Public
 */
router.get('/:studentId/:problemId', getStudentAnswers);

export default router;
