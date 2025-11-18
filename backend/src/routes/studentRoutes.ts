import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { Student, StudentProgress } from '../types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * @route   GET /api/students/:id
 * @desc    Get student by ID
 * @access  Public
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const students = await query<Student[]>(
      'SELECT * FROM students WHERE id = ?',
      [id]
    );

    if (students.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Student not found',
      });
      return;
    }

    res.json({
      success: true,
      data: students[0],
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student',
    });
  }
});

/**
 * @route   GET /api/students/:id/progress
 * @desc    Get student progress statistics
 * @access  Public
 */
router.get('/:id/progress', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const progress = await query<StudentProgress[]>(
      'SELECT * FROM student_progress WHERE student_id = ?',
      [id]
    );

    if (progress.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No progress data found',
      });
      return;
    }

    res.json({
      success: true,
      data: progress[0],
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progress',
    });
  }
});

/**
 * @route   POST /api/students
 * @desc    Create or sync student from Moodle
 * @access  Public
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { moodle_user_id, username, email } = req.body;

    if (!username) {
      res.status(400).json({
        success: false,
        error: 'Username is required',
      });
      return;
    }

    // Check if student already exists
    if (moodle_user_id) {
      const existing = await query<Student[]>(
        'SELECT * FROM students WHERE moodle_user_id = ?',
        [moodle_user_id]
      );

      if (existing.length > 0) {
        res.json({
          success: true,
          data: existing[0],
          message: 'Student already exists',
        });
        return;
      }
    }

    // Create new student
    const studentId = uuidv4();
    await query(
      `INSERT INTO students (id, moodle_user_id, username, email)
       VALUES (?, ?, ?, ?)`,
      [studentId, moodle_user_id, username, email]
    );

    const newStudent = await query<Student[]>(
      'SELECT * FROM students WHERE id = ?',
      [studentId]
    );

    res.status(201).json({
      success: true,
      data: newStudent[0],
      message: 'Student created successfully',
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create student',
    });
  }
});

export default router;
