const express = require('express');
const router = express.Router();
const moodleController = require('../controllers/moodleController');

// Test Moodle connection
router.get('/test', moodleController.testConnection);

// Get course information
router.get('/course/:courseId', moodleController.getCourse);

// Sync problem from Moodle
router.post('/sync/:questionId', moodleController.syncProblem);

module.exports = router;
