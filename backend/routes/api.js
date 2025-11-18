// API Routes
const express = require('express');
const router = express.Router();

const conceptController = require('../controllers/conceptController');
const moodleController = require('../controllers/moodleController');

// Concept routes
router.get('/concepts', conceptController.getAllConcepts.bind(conceptController));
router.get('/concepts/:number', conceptController.getConceptTree.bind(conceptController));
router.post('/concepts/track', conceptController.trackInteraction.bind(conceptController));

// Moodle routes
router.get('/moodle/test', moodleController.testConnection.bind(moodleController));
router.get('/problems/:id', moodleController.getProblem.bind(moodleController));
router.get('/moodle/courses/:userId', moodleController.getUserCourses.bind(moodleController));
router.get('/moodle/course/:courseId/contents', moodleController.getCourseContents.bind(moodleController));

module.exports = router;
