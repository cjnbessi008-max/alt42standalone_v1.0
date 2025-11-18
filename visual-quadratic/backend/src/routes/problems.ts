import { Router } from 'express';
import { query } from '../config/database.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createProblemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  target_a: z.number(),
  target_b: z.number(),
  target_c: z.number(),
  difficulty: z.number().int().min(1).max(5),
  hints: z.array(z.string()).optional(),
});

// GET /api/problems - Get all problems
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM problems ORDER BY difficulty ASC, created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// GET /api/problems/:id - Get problem by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM problems WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

// POST /api/problems - Create new problem
router.post('/', async (req, res) => {
  try {
    const data = createProblemSchema.parse(req.body);

    const result = await query(
      `INSERT INTO problems (title, description, target_a, target_b, target_c, difficulty, hints)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.title,
        data.description,
        data.target_a,
        data.target_b,
        data.target_c,
        data.difficulty,
        JSON.stringify(data.hints || []),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating problem:', error);
    res.status(500).json({ error: 'Failed to create problem' });
  }
});

// GET /api/problems/difficulty/:level - Get problems by difficulty
router.get('/difficulty/:level', async (req, res) => {
  try {
    const level = parseInt(req.params.level);
    if (isNaN(level) || level < 1 || level > 5) {
      return res.status(400).json({ error: 'Invalid difficulty level (1-5)' });
    }

    const result = await query(
      'SELECT * FROM problems WHERE difficulty = $1 ORDER BY created_at DESC',
      [level]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching problems by difficulty:', error);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

export default router;
