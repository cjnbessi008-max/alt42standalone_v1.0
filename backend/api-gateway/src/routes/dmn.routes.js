/**
 * DMN Status Routes
 * Endpoints for DMN status analysis and tracking
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');
const { broadcastDMNStatus } = require('../middleware/websocket');

const DMN_SERVICE_URL = config.dmnService.baseUrl;

/**
 * POST /api/dmn/analyze
 * Analyze interaction events and get DMN status
 */
router.post('/analyze', async (req, res, next) => {
  try {
    const analysisRequest = req.body;

    // Forward to DMN service
    const response = await axios.post(
      `${DMN_SERVICE_URL}/api/dmn/analyze`,
      analysisRequest,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const dmnStatus = response.data;

    // Broadcast to WebSocket clients
    const io = req.app.get('io');
    if (io) {
      broadcastDMNStatus(io, dmnStatus);
    }

    // TODO: Store in database
    logger.info(`DMN analysis completed for student ${dmnStatus.student_id}: ${dmnStatus.status}`);

    res.json(dmnStatus);

  } catch (error) {
    logger.error(`DMN analysis failed: ${error.message}`);
    next(error);
  }
});

/**
 * POST /api/dmn/event
 * Track single interaction event
 */
router.post('/event', async (req, res, next) => {
  try {
    const event = req.body;

    // Forward to DMN service
    const response = await axios.post(
      `${DMN_SERVICE_URL}/api/dmn/event`,
      event,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    res.json(response.data);

  } catch (error) {
    logger.error(`Event tracking failed: ${error.message}`);
    next(error);
  }
});

/**
 * GET /api/dmn/status/:studentId/:sessionId
 * Get current DMN status for a student session
 */
router.get('/status/:studentId/:sessionId', async (req, res, next) => {
  try {
    const { studentId, sessionId } = req.params;

    // TODO: Query database for latest status
    // For now, return mock data
    res.json({
      student_id: studentId,
      session_id: sessionId,
      status: 'active_learning',
      color_code: '#2196F3',
      confidence_score: 0.78,
      recorded_at: new Date().toISOString(),
      message: 'Database integration pending'
    });

  } catch (error) {
    logger.error(`Failed to get DMN status: ${error.message}`);
    next(error);
  }
});

/**
 * GET /api/dmn/history/:studentId
 * Get DMN status history for a student
 */
router.get('/history/:studentId', async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { sessionId, limit = 50, offset = 0 } = req.query;

    // TODO: Query database for history
    logger.info(`Fetching DMN history for student ${studentId}`);

    res.json({
      student_id: studentId,
      session_id: sessionId,
      history: [],
      message: 'Database integration pending'
    });

  } catch (error) {
    logger.error(`Failed to get DMN history: ${error.message}`);
    next(error);
  }
});

/**
 * GET /api/dmn/analytics/:studentId
 * Get DMN analytics for a student
 */
router.get('/analytics/:studentId', async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { courseId, startDate, endDate, groupBy = 'day' } = req.query;

    // TODO: Query database for analytics
    logger.info(`Fetching DMN analytics for student ${studentId}`);

    res.json({
      student_id: studentId,
      course_id: courseId,
      analytics: {
        deep_focus_percentage: 35,
        active_learning_percentage: 45,
        wandering_percentage: 15,
        disengaged_percentage: 5,
        total_sessions: 12,
        avg_session_duration: 1800
      },
      message: 'Database integration pending'
    });

  } catch (error) {
    logger.error(`Failed to get DMN analytics: ${error.message}`);
    next(error);
  }
});

/**
 * GET /api/dmn/config/thresholds
 * Get current DMN threshold configuration
 */
router.get('/config/thresholds', async (req, res, next) => {
  try {
    const response = await axios.get(`${DMN_SERVICE_URL}/api/dmn/config/thresholds`);
    res.json(response.data);
  } catch (error) {
    logger.error(`Failed to get thresholds: ${error.message}`);
    next(error);
  }
});

/**
 * PUT /api/dmn/config/thresholds
 * Update DMN threshold configuration
 */
router.put('/config/thresholds', async (req, res, next) => {
  try {
    const thresholds = req.body;

    const response = await axios.put(
      `${DMN_SERVICE_URL}/api/dmn/config/thresholds`,
      null,
      {
        params: thresholds
      }
    );

    logger.info('DMN thresholds updated', thresholds);
    res.json(response.data);

  } catch (error) {
    logger.error(`Failed to update thresholds: ${error.message}`);
    next(error);
  }
});

module.exports = router;
