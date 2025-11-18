import express from 'express';
import {
  createSession,
  getSession,
  getStudentSessions,
  getActiveSession,
  endSession,
  updateSession,
  getActiveSessions,
  deleteSession
} from '../controllers/sessionController.js';

const router = express.Router();

// POST /api/sessions - Create new session
router.post('/', createSession);

// GET /api/sessions/active - Get all active sessions
router.get('/active', getActiveSessions);

// GET /api/sessions/:sessionId - Get specific session
router.get('/:sessionId', getSession);

// PUT /api/sessions/:sessionId - Update session
router.put('/:sessionId', updateSession);

// DELETE /api/sessions/:sessionId - Delete session
router.delete('/:sessionId', deleteSession);

// POST /api/sessions/:sessionId/end - End session
router.post('/:sessionId/end', endSession);

// GET /api/sessions/student/:studentId - Get all sessions for a student
router.get('/student/:studentId', getStudentSessions);

// GET /api/sessions/student/:studentId/active - Get active session for student
router.get('/student/:studentId/active', getActiveSession);

export default router;
