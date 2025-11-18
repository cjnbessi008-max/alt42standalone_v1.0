const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');

/**
 * Progress Tracking API Routes
 * Base path: /api/progress
 */

// Get student progress for a module
router.get('/modules/:moduleId', progressController.getProgress);

// Get student progress history
router.get('/modules/:moduleId/history', progressController.getProgressHistory);

// Get mastery metrics
router.get('/modules/:moduleId/mastery', progressController.getMasteryMetrics);

module.exports = router;
