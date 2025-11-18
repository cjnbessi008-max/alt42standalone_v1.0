import express from 'express';
import { body, param, validationResult } from 'express-validator';
import * as Student from '../models/student.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * POST /api/students
 * Create or update student
 */
router.post(
  '/',
  [
    body('student_id').notEmpty().withMessage('Student ID is required'),
    body('name').notEmpty().withMessage('Name is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { student_id, name, email } = req.body;
      const student = await Student.upsertStudent(student_id, name, email);

      res.json({
        success: true,
        data: student
      });
    } catch (error) {
      console.error('Error upserting student:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * GET /api/students/:student_id
 * Get student by ID
 */
router.get(
  '/:student_id',
  [
    param('student_id').notEmpty().withMessage('Student ID is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { student_id } = req.params;
      const student = await Student.getStudent(student_id);

      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'Student not found'
        });
      }

      res.json({
        success: true,
        data: student
      });
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * GET /api/students
 * Get all students
 */
router.get('/', async (req, res) => {
  try {
    const students = await Student.getAllStudents();

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
