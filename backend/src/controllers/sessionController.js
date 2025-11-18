import { v4 as uuidv4 } from 'uuid';
import Session from '../models/Session.js';

// Create a new session
export const createSession = async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      problemId,
      problemTitle,
      canvasWidth,
      canvasHeight
    } = req.body;

    // Validate required fields
    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'studentId is required'
      });
    }

    // Generate unique session ID
    const sessionId = `session-${studentId}-${Date.now()}-${uuidv4().split('-')[0]}`;

    const sessionData = {
      sessionId,
      studentId,
      studentName: studentName || `Student ${studentId}`,
      problemId: problemId || null,
      problemTitle: problemTitle || 'Mean Center Exercise',
      canvasWidth: canvasWidth || 800,
      canvasHeight: canvasHeight || 600
    };

    const session = await Session.create(sessionData);

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get session by ID
export const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findBySessionId(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all sessions for a student
export const getStudentSessions = async (req, res) => {
  try {
    const { studentId } = req.params;

    const sessions = await Session.findByStudentId(studentId);

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Error fetching student sessions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get active session for student
export const getActiveSession = async (req, res) => {
  try {
    const { studentId } = req.params;

    const session = await Session.getActiveSession(studentId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'No active session found for this student'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error fetching active session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// End a session
export const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findBySessionId(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const updatedSession = await Session.endSession(sessionId);

    res.json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update session
export const updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updates = req.body;

    const session = await Session.findBySessionId(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const updatedSession = await Session.update(sessionId, updates);

    res.json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all active sessions
export const getActiveSessions = async (req, res) => {
  try {
    const sessions = await Session.getActiveSessions();

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete session
export const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findBySessionId(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    await Session.delete(sessionId);

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
