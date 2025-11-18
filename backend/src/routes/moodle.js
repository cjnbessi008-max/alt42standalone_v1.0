import express from 'express';
import * as moodleController from '../controllers/moodleController.js';

const router = express.Router();

// LTI Launch endpoint
router.post('/lti/launch', moodleController.handleLTILaunch);

// Module sync endpoints
router.post('/sync/:moduleId', moodleController.syncModuleWithMoodle);
router.get('/sync/:moduleId/status', moodleController.getSyncStatus);

// Grade passback
router.post('/grades/send', moodleController.sendGradeToMoodle);

// Course management
router.get('/courses/:courseId', moodleController.getCourseInfo);
router.get('/courses/:courseId/students', moodleController.getEnrolledStudents);

export default router;
