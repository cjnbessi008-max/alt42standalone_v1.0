import express from 'express';
import {
  syncWithLMS,
  getProblemsFromLMS,
  configureLMS,
  getLMSStatus
} from '../controllers/lmsController.js';

const router = express.Router();

// POST sync with LMS (Moodle)
router.post('/sync', syncWithLMS);

// GET problems from LMS module
router.get('/problems/:moduleId', getProblemsFromLMS);

// POST configure LMS integration
router.post('/configure', configureLMS);

// GET LMS integration status
router.get('/status', getLMSStatus);

export default router;
