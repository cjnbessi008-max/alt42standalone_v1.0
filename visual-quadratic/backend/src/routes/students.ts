import { Router } from 'express';
import { query } from '../config/database.js';
import { z } from 'zod';

const router = Router();

// Validation schema
const createStudentSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  grade_level: z.string().optional(),
  moodle_user_id: z.string().optional(),
});

// GET /api/students - Get all students
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM students ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/students/:id - Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM students WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// POST /api/students - Create new student
router.post('/', async (req, res) => {
  try {
    const data = createStudentSchema.parse(req.body);

    const result = await query(
      `INSERT INTO students (name, email, grade_level, moodle_user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.name, data.email, data.grade_level, data.moodle_user_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// GET /api/students/moodle/:moodleId - Get student by Moodle ID
router.get('/moodle/:moodleId', async (req, res) => {
  try {
    const { moodleId } = req.params;
    const result = await query(
      'SELECT * FROM students WHERE moodle_user_id = $1',
      [moodleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching student by Moodle ID:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

export default router;
