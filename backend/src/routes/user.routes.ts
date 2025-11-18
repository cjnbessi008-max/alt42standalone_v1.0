import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import moodleService from '../services/moodle.service';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/v1/users/sync
 * Sync user from Moodle
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { moodleUserId } = req.body;

    if (!moodleUserId) {
      return res.status(400).json({
        success: false,
        error: 'moodleUserId is required',
      });
    }

    // Get user from Moodle
    const moodleUser = await moodleService.getUser(parseInt(moodleUserId));

    if (!moodleUser) {
      return res.status(404).json({
        success: false,
        error: 'Moodle user not found',
      });
    }

    // Create or update user in our database
    const user = await prisma.user.upsert({
      where: { moodleUserId: moodleUser.id },
      create: {
        moodleUserId: moodleUser.id,
        username: moodleUser.username,
        email: moodleUser.email,
        fullName: `${moodleUser.firstname} ${moodleUser.lastname}`,
      },
      update: {
        username: moodleUser.username,
        email: moodleUser.email,
        fullName: `${moodleUser.firstname} ${moodleUser.lastname}`,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Error syncing user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync user',
    });
  }
});

/**
 * GET /api/v1/users/:userId
 * Get user by ID
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        statistics: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    });
  }
});

/**
 * GET /api/v1/users/moodle/:moodleUserId
 * Get user by Moodle user ID
 */
router.get('/moodle/:moodleUserId', async (req: Request, res: Response) => {
  try {
    const moodleUserId = parseInt(req.params.moodleUserId);

    const user = await prisma.user.findUnique({
      where: { moodleUserId },
      include: {
        statistics: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Error fetching user by Moodle ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    });
  }
});

/**
 * PUT /api/v1/users/:userId/preferences
 * Update user preferences
 */
router.put('/:userId/preferences', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { preferences } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { preferences },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Error updating user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user preferences',
    });
  }
});

export default router;
