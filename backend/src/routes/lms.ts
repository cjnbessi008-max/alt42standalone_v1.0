/**
 * LMS Integration Routes
 */

import { Router } from 'express';
import { LMSIntegrationService } from '../services/lmsIntegrationService.js';
import { logger } from '../utils/logger.js';

const router = Router();
const lmsService = new LMSIntegrationService();

/**
 * GET /api/v1/lms/health
 * Check LMS connection health
 */
router.get('/health', async (req, res) => {
  try {
    const isConnected = await lmsService.validateConnection();

    res.json({
      success: true,
      data: {
        connected: isConnected,
        timestamp: new Date()
      }
    });
  } catch (error: any) {
    logger.error('Error checking LMS health:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/lms/students/:studentId
 * Get student data from LMS
 */
router.get('/students/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await lmsService.getStudentFromLMS(studentId);

    res.json({
      success: true,
      data: student
    });
  } catch (error: any) {
    logger.error('Error fetching student from LMS:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/lms/students/:studentId/enrollments
 * Get student enrollments from LMS
 */
router.get('/students/:studentId/enrollments', async (req, res) => {
  try {
    const { studentId } = req.params;
    const enrollments = await lmsService.getStudentEnrollments(studentId);

    res.json({
      success: true,
      data: enrollments
    });
  } catch (error: any) {
    logger.error('Error fetching enrollments from LMS:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/lms/webhook
 * Receive webhooks from LMS
 */
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    await lmsService.handleLMSWebhook(event);

    res.json({
      success: true,
      message: 'Webhook processed'
    });
  } catch (error: any) {
    logger.error('Error processing LMS webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { router as lmsRoutes };
