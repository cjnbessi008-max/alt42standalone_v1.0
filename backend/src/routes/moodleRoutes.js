import express from 'express';
import {
  getMoodleUser,
  getMoodleProblem,
  authenticateMoodle,
  getMoodleCourse,
  testMoodleConnection
} from '../controllers/moodleController.js';

const router = express.Router();

// POST /api/moodle/auth - Authenticate with Moodle
router.post('/auth', authenticateMoodle);

// GET /api/moodle/test - Test Moodle connection
router.get('/test', testMoodleConnection);

// GET /api/moodle/user/:userId - Get user information
router.get('/user/:userId', getMoodleUser);

// GET /api/moodle/problem/:quizId - Get problem/quiz information
router.get('/problem/:quizId', getMoodleProblem);

// GET /api/moodle/course/:courseId - Get course information
router.get('/course/:courseId', getMoodleCourse);

export default router;
