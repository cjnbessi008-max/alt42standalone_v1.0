/**
 * Problems Routes
 */

const express = require('express');
const router = express.Router();
const ProblemController = require('../controllers/problemController');
const authMiddleware = require('../middleware/auth');

// All problem routes require authentication
router.use(authMiddleware);

// Get recommended problem
router.get('/recommended', ProblemController.getRecommendedProblem);

// Submit answer
router.post('/:id/submit', ProblemController.submitAnswer);

// Get statistics
router.get('/stats', ProblemController.getStats);

// Get achievements
router.get('/achievements', ProblemController.getAchievements);

module.exports = router;
