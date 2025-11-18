/**
 * API Routes
 */

import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';

// Controllers
import * as authController from '../controllers/authController.js';
import * as quizController from '../controllers/quizController.js';
import * as attemptController from '../controllers/attemptController.js';
import * as patternsController from '../controllers/patternsController.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// Auth Routes (Public)
// ============================================================================

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Auth Routes (Protected)
router.post('/auth/logout', authenticateToken, authController.logout);
router.get('/auth/profile', authenticateToken, authController.getProfile);
router.put('/auth/profile', authenticateToken, authController.updateProfile);

// ============================================================================
// Quiz Routes
// ============================================================================

// Get all quizzes (filtered by role)
router.get('/quizzes', authenticateToken, quizController.getQuizzes);

// Get single quiz
router.get('/quizzes/:id', authenticateToken, quizController.getQuizById);

// Create quiz (teachers only)
router.post('/quizzes', authenticateToken, requireRole('teacher'), quizController.createQuiz);

// Update quiz (teachers only)
router.put('/quizzes/:id', authenticateToken, requireRole('teacher'), quizController.updateQuiz);

// Delete quiz (teachers only)
router.delete('/quizzes/:id', authenticateToken, requireRole('teacher'), quizController.deleteQuiz);

// Question management (teachers only)
router.post('/quizzes/:quizId/questions', authenticateToken, requireRole('teacher'), quizController.addQuestion);
router.put('/questions/:questionId', authenticateToken, requireRole('teacher'), quizController.updateQuestion);
router.delete('/questions/:questionId', authenticateToken, requireRole('teacher'), quizController.deleteQuestion);

// ============================================================================
// Quiz Attempt Routes (Students)
// ============================================================================

// Start quiz attempt
router.post('/quizzes/:quizId/attempts', authenticateToken, requireRole('student'), attemptController.startAttempt);

// Submit answer
router.post('/attempts/:attemptId/questions/:questionId/answer', authenticateToken, requireRole('student'), attemptController.submitAnswer);

// Complete attempt
router.post('/attempts/:attemptId/complete', authenticateToken, requireRole('student'), attemptController.completeAttempt);

// Get attempt results
router.get('/attempts/:attemptId', authenticateToken, attemptController.getAttemptResults);

// Get student history
router.get('/students/history', authenticateToken, requireRole('student'), attemptController.getStudentHistory);
router.get('/students/:studentId/history', authenticateToken, requireRole('teacher'), attemptController.getStudentHistory);

// ============================================================================
// Chaos Harmony Pattern Routes
// ============================================================================

// Analyze patterns
router.get('/patterns/analyze', authenticateToken, requireRole('student'), patternsController.analyzePatterns);
router.get('/patterns/analyze/:studentId', authenticateToken, requireRole('teacher'), patternsController.analyzePatterns);

// Get patterns
router.get('/patterns', authenticateToken, requireRole('student'), patternsController.getPatterns);
router.get('/patterns/:studentId', authenticateToken, requireRole('teacher'), patternsController.getPatterns);

// Get visualization state
router.get('/visualization', authenticateToken, requireRole('student'), patternsController.getVisualizationState);
router.get('/visualization/:studentId', authenticateToken, requireRole('teacher'), patternsController.getVisualizationState);

// Get analytics
router.get('/analytics', authenticateToken, requireRole('student'), patternsController.getAnalytics);
router.get('/analytics/:studentId', authenticateToken, requireRole('teacher'), patternsController.getAnalytics);

// ============================================================================
// Error handler for undefined routes
// ============================================================================

router.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

export default router;
