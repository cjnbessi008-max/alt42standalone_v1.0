// Moodle LTI Integration Routes

import { Router, Request, Response } from 'express';
import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse, MoodleLTIPayload } from '../types/index.js';

const router = Router();

/**
 * POST /api/moodle/lti-launch
 * Handle LTI launch request from Moodle
 */
router.post('/lti-launch', async (req: Request, res: Response) => {
  try {
    const {
      lti_message_type,
      lti_version,
      resource_link_id,
      context_id,
      user_id,
      roles,
      lis_person_name_given,
      lis_person_name_family,
      lis_person_contact_email_primary,
    } = req.body;

    // Validate LTI parameters
    if (!lti_message_type || !resource_link_id || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required LTI parameters',
      } as ApiResponse);
    }

    // Create or update user based on LTI data
    const email = lis_person_contact_email_primary || `${user_id}@lti.temp`;
    const name = lis_person_name_given && lis_person_name_family
      ? `${lis_person_name_given} ${lis_person_name_family}`
      : `User ${user_id}`;

    const role = roles && roles.includes('Instructor') ? 'teacher' : 'student';

    // Insert or update user
    const userResult = await query(
      `
      INSERT INTO users (email, name, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE SET name = $2, role = $3
      RETURNING id
      `,
      [email, name, role]
    );

    const userId = userResult.rows[0].id;

    // Create LTI session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await query(
      `
      INSERT INTO moodle_lti_sessions
      (id, user_id, context_id, resource_link_id, lti_user_id, roles, session_data, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        sessionId,
        userId,
        context_id,
        resource_link_id,
        user_id,
        JSON.stringify(roles),
        JSON.stringify(req.body),
        expiresAt,
      ]
    );

    // Generate session token (in production, use proper JWT)
    const sessionToken = Buffer.from(JSON.stringify({
      sessionId,
      userId,
      role,
    })).toString('base64');

    // Redirect to frontend with session token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?session=${sessionToken}&module=demo-module-1`);
  } catch (error) {
    console.error('LTI launch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process LTI launch',
    } as ApiResponse);
  }
});

/**
 * GET /api/moodle/session/:sessionId
 * Get LTI session data
 */
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const result = await query(
      `
      SELECT s.*, u.id as user_id, u.email, u.name, u.role
      FROM moodle_lti_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1 AND s.expires_at > NOW()
      `,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or expired',
      } as ApiResponse);
    }

    const session = result.rows[0];

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        userId: session.user_id,
        email: session.email,
        name: session.name,
        role: session.role,
        contextId: session.context_id,
        resourceLinkId: session.resource_link_id,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session',
    } as ApiResponse);
  }
});

/**
 * POST /api/moodle/grade-passback
 * Send grade back to Moodle (LTI Outcome Service)
 */
router.post('/grade-passback', async (req: Request, res: Response) => {
  try {
    const { sessionId, score } = req.body;

    if (!sessionId || score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and score are required',
      } as ApiResponse);
    }

    // Get session data
    const sessionResult = await query(
      `SELECT * FROM moodle_lti_sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      } as ApiResponse);
    }

    // In production, implement LTI Outcome Service to send grade back to Moodle
    // This requires OAuth signing and XML message format
    // For now, just log the grade

    console.log(`Grade passback for session ${sessionId}: ${score}`);

    res.json({
      success: true,
      message: 'Grade recorded (passback to Moodle pending implementation)',
    } as ApiResponse);
  } catch (error) {
    console.error('Error with grade passback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process grade passback',
    } as ApiResponse);
  }
});

export default router;
