import express from 'express';
import {
  getQuestionById,
  getRandomQuestion,
  submitAnswer,
} from '../controllers/questionController.js';

const router = express.Router();

// Get question by ID
router.get('/:id', getQuestionById);

// Get random question
router.get('/random', getRandomQuestion);

// Submit answer
router.post('/:id/submit', submitAnswer);

export default router;
