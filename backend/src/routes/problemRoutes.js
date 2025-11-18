const express = require('express');
const router = express.Router();
const problemController = require('../controllers/problemController');

// GET all problems
router.get('/', problemController.getAllProblems);

// GET problem by ID
router.get('/:id', problemController.getProblemById);

// GET problem by Moodle ID
router.get('/moodle/:moodleId', problemController.getProblemByMoodleId);

// GET smooth intervals for a problem
router.get('/:id/smooth-intervals', problemController.getSmoothIntervals);

// POST create new problem
router.post('/', problemController.createProblem);

// PUT update problem
router.put('/:id', problemController.updateProblem);

// DELETE problem
router.delete('/:id', problemController.deleteProblem);

module.exports = router;
