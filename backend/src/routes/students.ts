import express, { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { query } from '../config/database';

const router = express.Router();

/**
 * GET /api/students
 * Get all students
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const students = await query('SELECT * FROM students ORDER BY full_name ASC');

    res.json({
      status: 'success',
      data: { students },
    });
  })
);

/**
 * GET /api/students/:id
 * Get a specific student
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const students = await query('SELECT * FROM students WHERE id = ?', [id]);
    const student = students[0];

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found',
      });
    }

    res.json({
      status: 'success',
      data: { student },
    });
  })
);

/**
 * GET /api/students/:id/performance
 * Get student performance summary
 */
router.get(
  '/:id/performance',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const performance = await query(
      'SELECT * FROM v_student_performance WHERE student_id = ?',
      [id]
    );

    if (performance.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found',
      });
    }

    res.json({
      status: 'success',
      data: { performance: performance[0] },
    });
  })
);

export default router;
