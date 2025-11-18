import { Router, Request, Response } from 'express';
import moodleService from '../services/moodle';
import { ApiResponse } from '../types';

const router = Router();

// POST /api/moodle/test - Test Moodle connection
router.post('/test', async (req: Request, res: Response) => {
  try {
    const connected = await moodleService.testConnection();

    if (connected) {
      const response: ApiResponse<{ connected: boolean }> = {
        success: true,
        data: { connected: true },
        message: 'Moodle connection successful',
      };
      res.json(response);
    } else {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Moodle connection failed',
      };
      res.status(500).json(response);
    }
  } catch (error: any) {
    console.error('Moodle test error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error.message || 'Moodle connection test failed',
    };
    res.status(500).json(response);
  }
});

// GET /api/moodle/user/:userId - Get user from Moodle
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = await moodleService.getUser(userId);

    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User not found in Moodle',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof user> = {
      success: true,
      data: user,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get user error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error.message || 'Failed to get user from Moodle',
    };
    res.status(500).json(response);
  }
});

// POST /api/moodle/grade - Submit grade to Moodle
router.post('/grade', async (req: Request, res: Response) => {
  try {
    const { courseId, userId, itemName, grade, maxGrade } = req.body;

    if (!courseId || !userId || !itemName || grade === undefined) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing required fields',
      };
      return res.status(400).json(response);
    }

    const success = await moodleService.submitGrade({
      courseId,
      userId,
      itemName,
      grade,
      maxGrade,
    });

    if (success) {
      const response: ApiResponse<{ submitted: boolean }> = {
        success: true,
        data: { submitted: true },
        message: 'Grade submitted to Moodle successfully',
      };
      res.json(response);
    } else {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to submit grade to Moodle',
      };
      res.status(500).json(response);
    }
  } catch (error: any) {
    console.error('Submit grade error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error.message || 'Failed to submit grade',
    };
    res.status(500).json(response);
  }
});

// GET /api/moodle/course/:courseId/users - Get enrolled users
router.get('/course/:courseId/users', async (req: Request, res: Response) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const users = await moodleService.getEnrolledUsers(courseId);

    const response: ApiResponse<typeof users> = {
      success: true,
      data: users,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get enrolled users error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error.message || 'Failed to get enrolled users',
    };
    res.status(500).json(response);
  }
});

// POST /api/moodle/sync - Sync data from Moodle
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { type, id } = req.body;

    if (type === 'quiz') {
      const problems = await moodleService.syncProblemFromQuiz(id);
      const response: ApiResponse<typeof problems> = {
        success: true,
        data: problems,
        message: `Synced ${problems.length} problems from Moodle quiz`,
      };
      res.json(response);
    } else {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid sync type',
      };
      res.status(400).json(response);
    }
  } catch (error: any) {
    console.error('Sync error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error.message || 'Failed to sync from Moodle',
    };
    res.status(500).json(response);
  }
});

export default router;
