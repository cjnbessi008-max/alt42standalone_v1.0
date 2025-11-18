import express from 'express';
import {
  syncProblemsFromMoodle,
  sendResultsToMoodle,
  getMoodleQuizzes
} from '../controllers/moodleController.js';

const router = express.Router();

// POST /api/moodle/sync - Sync problems from Moodle
router.post('/sync', syncProblemsFromMoodle);

// POST /api/moodle/results - Send results back to Moodle
router.post('/results', sendResultsToMoodle);

// GET /api/moodle/quizzes - Get available quizzes from Moodle
router.get('/quizzes', getMoodleQuizzes);

export default router;
