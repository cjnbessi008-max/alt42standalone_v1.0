import { Router, Request, Response } from 'express';
import axios from 'axios';
import { MoodleUser, MoodleQuestion } from '../types';

const router = Router();

const MOODLE_URL = process.env.MOODLE_URL || '';
const MOODLE_TOKEN = process.env.MOODLE_API_TOKEN || '';

/**
 * @route   POST /api/moodle/sync-user
 * @desc    Sync user data from Moodle
 * @access  Public
 */
router.post('/sync-user', async (req: Request, res: Response) => {
  try {
    const { moodle_user_id } = req.body;

    if (!MOODLE_URL || !MOODLE_TOKEN) {
      res.status(501).json({
        success: false,
        error: 'Moodle integration not configured',
      });
      return;
    }

    // Call Moodle web service
    const response = await axios.get(`${MOODLE_URL}/webservice/rest/server.php`, {
      params: {
        wstoken: MOODLE_TOKEN,
        wsfunction: 'core_user_get_users_by_field',
        moodlewsrestformat: 'json',
        field: 'id',
        'values[0]': moodle_user_id,
      },
    });

    const users: MoodleUser[] = response.data;

    if (!users || users.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found in Moodle',
      });
      return;
    }

    const user = users[0];

    res.json({
      success: true,
      data: {
        moodle_user_id: user.id,
        username: user.username,
        email: user.email,
        fullname: `${user.firstname} ${user.lastname}`,
      },
    });
  } catch (error) {
    console.error('Error syncing from Moodle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync user from Moodle',
    });
  }
});

/**
 * @route   POST /api/moodle/sync-question
 * @desc    Sync question data from Moodle
 * @access  Teacher only
 */
router.post('/sync-question', async (req: Request, res: Response) => {
  try {
    const { moodle_question_id } = req.body;

    if (!MOODLE_URL || !MOODLE_TOKEN) {
      res.status(501).json({
        success: false,
        error: 'Moodle integration not configured',
      });
      return;
    }

    // This is a placeholder - actual implementation depends on Moodle question bank API
    res.json({
      success: true,
      message: 'Question sync endpoint - to be implemented based on Moodle API',
    });
  } catch (error) {
    console.error('Error syncing question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync question from Moodle',
    });
  }
});

/**
 * @route   POST /api/moodle/send-grade
 * @desc    Send grade back to Moodle gradebook
 * @access  Public
 */
router.post('/send-grade', async (req: Request, res: Response) => {
  try {
    const { moodle_user_id, moodle_question_id, grade } = req.body;

    if (!MOODLE_URL || !MOODLE_TOKEN) {
      res.status(501).json({
        success: false,
        error: 'Moodle integration not configured',
      });
      return;
    }

    // This would integrate with Moodle gradebook
    // Implementation depends on specific Moodle setup
    res.json({
      success: true,
      message: 'Grade sending endpoint - to be implemented',
    });
  } catch (error) {
    console.error('Error sending grade:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send grade to Moodle',
    });
  }
});

export default router;
