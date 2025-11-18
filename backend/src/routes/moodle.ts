import express, { Request, Response } from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { cacheGet, cacheSet } from '../config/redis';

const router = express.Router();

const MOODLE_URL = process.env.MOODLE_URL;
const MOODLE_TOKEN = process.env.MOODLE_API_TOKEN;

/**
 * Helper function to call Moodle Web Service API
 */
async function callMoodleAPI(wsfunction: string, params: any = {}) {
  if (!MOODLE_URL || !MOODLE_TOKEN) {
    throw new AppError('Moodle configuration not set', 500);
  }

  const url = `${MOODLE_URL}/webservice/rest/server.php`;

  try {
    const response = await axios.get(url, {
      params: {
        wstoken: MOODLE_TOKEN,
        wsfunction,
        moodlewsrestformat: 'json',
        ...params,
      },
    });

    if (response.data.exception) {
      throw new Error(response.data.message || 'Moodle API error');
    }

    return response.data;
  } catch (error: any) {
    logger.error(`Moodle API error (${wsfunction}):`, error.message);
    throw new AppError(`Moodle API error: ${error.message}`, 500);
  }
}

/**
 * POST /api/moodle/sync/students
 * Sync students from Moodle
 */
router.post(
  '/sync/students',
  asyncHandler(async (req: Request, res: Response) => {
    // Get users from Moodle
    const moodleUsers = await callMoodleAPI('core_user_get_users', {
      'criteria[0][key]': 'deleted',
      'criteria[0][value]': '0',
    });

    const syncedCount = 0;

    for (const user of moodleUsers.users || []) {
      // Check if student already exists
      const existing = await query(
        'SELECT id FROM students WHERE moodle_user_id = ?',
        [user.id]
      );

      if (existing.length === 0) {
        // Insert new student
        await query(
          `INSERT INTO students (id, moodle_user_id, username, full_name, email)
           VALUES (?, ?, ?, ?, ?)`,
          [uuidv4(), user.id, user.username, user.fullname, user.email]
        );
      } else {
        // Update existing student
        await query(
          `UPDATE students
           SET username = ?, full_name = ?, email = ?, updated_at = NOW()
           WHERE moodle_user_id = ?`,
          [user.username, user.fullname, user.email, user.id]
        );
      }
    }

    logger.info(`Synced ${moodleUsers.users?.length || 0} students from Moodle`);

    res.json({
      status: 'success',
      message: `Synced ${moodleUsers.users?.length || 0} students`,
    });
  })
);

/**
 * POST /api/moodle/sync/courses
 * Sync courses from Moodle
 */
router.post(
  '/sync/courses',
  asyncHandler(async (req: Request, res: Response) => {
    // Get all courses from Moodle
    const courses = await callMoodleAPI('core_course_get_courses');

    for (const course of courses || []) {
      // Check if course already exists
      const existing = await query(
        'SELECT id FROM courses WHERE moodle_course_id = ?',
        [course.id]
      );

      if (existing.length === 0) {
        // Insert new course
        await query(
          `INSERT INTO courses (id, moodle_course_id, course_name, course_code, subject, description)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            course.id,
            course.fullname,
            course.shortname,
            'mathematics',
            course.summary || '',
          ]
        );
      } else {
        // Update existing course
        await query(
          `UPDATE courses
           SET course_name = ?, course_code = ?, description = ?, updated_at = NOW()
           WHERE moodle_course_id = ?`,
          [course.fullname, course.shortname, course.summary || '', course.id]
        );
      }
    }

    logger.info(`Synced ${courses?.length || 0} courses from Moodle`);

    res.json({
      status: 'success',
      message: `Synced ${courses?.length || 0} courses`,
    });
  })
);

/**
 * GET /api/moodle/user/:moodleUserId
 * Get Moodle user information with caching
 */
router.get(
  '/user/:moodleUserId',
  asyncHandler(async (req: Request, res: Response) => {
    const { moodleUserId } = req.params;
    const cacheKey = `moodle:user:${moodleUserId}`;

    // Check cache first
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json({
        status: 'success',
        data: JSON.parse(cached),
        cached: true,
      });
    }

    // Fetch from Moodle
    const users = await callMoodleAPI('core_user_get_users_by_field', {
      field: 'id',
      'values[0]': moodleUserId,
    });

    if (!users || users.length === 0) {
      throw new AppError('User not found in Moodle', 404);
    }

    const user = users[0];

    // Cache for 1 hour
    await cacheSet(cacheKey, JSON.stringify(user), 3600);

    res.json({
      status: 'success',
      data: user,
      cached: false,
    });
  })
);

export default router;
