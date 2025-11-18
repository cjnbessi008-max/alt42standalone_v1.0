import express from 'express';
import {
  getProgress,
  updateProgress,
  getLeaderboard
} from '../controllers/progressController.js';

const router = express.Router();

// GET /api/progress/:studentId - Get student progress
router.get('/:studentId', getProgress);

// PUT /api/progress/:studentId - Update student progress
router.put('/:studentId', updateProgress);

// GET /api/progress/leaderboard/top - Get leaderboard
router.get('/leaderboard/top', getLeaderboard);

export default router;
