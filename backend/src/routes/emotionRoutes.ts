import { Router } from 'express';
import emotionController from '../controllers/emotionController';

const router = Router();

// Create new emotion record
router.post('/', emotionController.createEmotion);

// Get emotions by student
router.get('/student/:studentId', emotionController.getEmotionsByStudent);

// Get emotions by session
router.get('/session/:sessionId', emotionController.getEmotionsBySession);

// Get emotion distribution for student
router.get('/student/:studentId/distribution', emotionController.getEmotionDistribution);

// Update emotion record
router.put('/:id', emotionController.updateEmotion);

// Delete emotion record
router.delete('/:id', emotionController.deleteEmotion);

export default router;
