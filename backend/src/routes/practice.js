const express = require('express');
const router = express.Router();
const practiceController = require('../controllers/practiceController');

/**
 * Practice Mode API Routes
 * Base path: /api/practice
 */

// Get next problem for student
router.get('/modules/:moduleId/next-problem', practiceController.getNextProblem);

// Get specific problem by ID
router.get('/modules/:moduleId/problems/:problemId', practiceController.getProblemById);

// Submit answer
router.post('/modules/:moduleId/submit-answer', practiceController.submitAnswer);

// Get practice suggestion
router.get('/modules/:moduleId/practice-suggestion', practiceController.getPracticeSuggestion);

// Request practice more
router.post('/modules/:moduleId/practice-more', practiceController.startPracticeMore);

// Request hint
router.post('/modules/:moduleId/request-hint', practiceController.requestHint);

module.exports = router;
