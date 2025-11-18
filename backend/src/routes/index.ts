import { Router } from 'express';
import { problemController } from '../controllers/problemController';
import { sessionController } from '../controllers/sessionController';
import { moodleController } from '../controllers/moodleController';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mathematical Garden API is running',
    timestamp: new Date().toISOString(),
  });
});

// Problem routes
router.get('/problems', problemController.getAll);
router.get('/problems/random', problemController.getRandom);
router.get('/problems/:id', problemController.getById);
router.post('/problems', problemController.create);
router.put('/problems/:id', problemController.update);
router.delete('/problems/:id', problemController.delete);

// Session routes
router.post('/sessions', sessionController.create);
router.get('/sessions/:session_id', sessionController.getBySessionId);
router.get('/sessions/:session_id/stats', sessionController.getStats);
router.post('/sessions/:session_id/attempts', sessionController.submitAttempt);
router.get('/sessions/:session_id/attempts', sessionController.getAttempts);

// Moodle integration routes
router.get('/moodle/test', moodleController.testConnection);
router.post('/moodle/import-quiz/:quizId', moodleController.importQuiz);

export default router;
