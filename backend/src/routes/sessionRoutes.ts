import { Router } from 'express';
import sessionController from '../controllers/sessionController';

const router = Router();

// Create new learning session
router.post('/start', sessionController.createSession);

// End a learning session
router.put('/:id/end', sessionController.endSession);

// Get session by ID
router.get('/:id', sessionController.getSessionById);

// Get sessions by student
router.get('/student/:studentId', sessionController.getSessionsByStudent);

// Get active sessions for student
router.get('/student/:studentId/active', sessionController.getActiveSessions);

// Get session statistics
router.get('/student/:studentId/stats', sessionController.getSessionStats);

export default router;
