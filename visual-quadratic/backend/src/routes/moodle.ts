import { Router } from 'express';
import { moodleService } from '../services/moodleService.js';
import { query } from '../config/database.js';
import { z } from 'zod';

const router = Router();

// Validation schema
const syncStudentSchema = z.object({
  moodle_user_id: z.number().int().positive(),
});

// GET /api/moodle/status - Check Moodle integration status
router.get('/status', (req, res) => {
  const configured = moodleService.isConfigured();

  res.json({
    configured,
    message: configured
      ? 'Moodle integration is configured and ready'
      : 'Moodle integration is not configured. Set MOODLE_URL and MOODLE_TOKEN in .env',
  });
});

// POST /api/moodle/sync-student - Sync student from Moodle
router.post('/sync-student', async (req, res) => {
  try {
    if (!moodleService.isConfigured()) {
      return res.status(503).json({
        error: 'Moodle integration not configured',
      });
    }

    const { moodle_user_id } = syncStudentSchema.parse(req.body);

    // Get student data from Moodle
    const studentData = await moodleService.syncStudent(moodle_user_id);

    // Check if student already exists
    const existing = await query(
      'SELECT * FROM students WHERE moodle_user_id = $1',
      [studentData.moodle_user_id]
    );

    let student;

    if (existing.rows.length > 0) {
      // Update existing student
      const updated = await query(
        `UPDATE students
         SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP
         WHERE moodle_user_id = $3
         RETURNING *`,
        [studentData.name, studentData.email, studentData.moodle_user_id]
      );
      student = updated.rows[0];
    } else {
      // Create new student
      const created = await query(
        `INSERT INTO students (name, email, moodle_user_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [studentData.name, studentData.email, studentData.moodle_user_id]
      );
      student = created.rows[0];
    }

    res.json({
      message: 'Student synced successfully',
      student,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error syncing student from Moodle:', error);
    res.status(500).json({ error: 'Failed to sync student' });
  }
});

// GET /api/moodle/user/:moodleId - Get Moodle user info
router.get('/user/:moodleId', async (req, res) => {
  try {
    if (!moodleService.isConfigured()) {
      return res.status(503).json({
        error: 'Moodle integration not configured',
      });
    }

    const moodleId = parseInt(req.params.moodleId);
    if (isNaN(moodleId)) {
      return res.status(400).json({ error: 'Invalid Moodle user ID' });
    }

    const user = await moodleService.getUser(moodleId);

    if (!user) {
      return res.status(404).json({ error: 'Moodle user not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching Moodle user:', error);
    res.status(500).json({ error: 'Failed to fetch Moodle user' });
  }
});

// GET /api/moodle/course/:courseId - Get Moodle course info
router.get('/course/:courseId', async (req, res) => {
  try {
    if (!moodleService.isConfigured()) {
      return res.status(503).json({
        error: 'Moodle integration not configured',
      });
    }

    const courseId = parseInt(req.params.courseId);
    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const course = await moodleService.getCourse(courseId);

    if (!course) {
      return res.status(404).json({ error: 'Moodle course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error('Error fetching Moodle course:', error);
    res.status(500).json({ error: 'Failed to fetch Moodle course' });
  }
});

// POST /api/moodle/report-grade - Report student grade back to Moodle
router.post('/report-grade', async (req, res) => {
  try {
    if (!moodleService.isConfigured()) {
      return res.status(503).json({
        error: 'Moodle integration not configured',
      });
    }

    const { course_id, moodle_user_id, item_name, grade } = req.body;

    await moodleService.submitGrade(course_id, moodle_user_id, item_name, grade);

    res.json({
      message: 'Grade reported to Moodle successfully',
    });
  } catch (error) {
    console.error('Error reporting grade to Moodle:', error);
    res.status(500).json({ error: 'Failed to report grade' });
  }
});

export default router;
