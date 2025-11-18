import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

// Get all problems
router.get('/', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  const logger = req.app.locals.logger;

  try {
    const { subject, gradeLevel, difficulty } = req.query;

    let query = 'SELECT * FROM problems WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (subject) {
      query += ` AND subject = $${paramCount}`;
      params.push(subject);
      paramCount++;
    }

    if (gradeLevel) {
      query += ` AND grade_level = $${paramCount}`;
      params.push(gradeLevel);
      paramCount++;
    }

    if (difficulty) {
      query += ` AND difficulty = $${paramCount}`;
      params.push(difficulty);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching problems:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problems'
    });
  }
});

// Get problem by ID
router.get('/:id', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  const logger = req.app.locals.logger;

  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM problems WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error fetching problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problem'
    });
  }
});

// Create new problem
router.post('/', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  const logger = req.app.locals.logger;

  try {
    const {
      id,
      title,
      description,
      type,
      correctAnswer,
      steps,
      difficulty,
      subject,
      gradeLevel
    } = req.body;

    const result = await db.query(
      `INSERT INTO problems (id, title, description, type, correct_answer, steps, difficulty, subject, grade_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, title, description, type, correctAnswer, JSON.stringify(steps), difficulty, subject, gradeLevel]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error creating problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create problem'
    });
  }
});

// Update problem
router.put('/:id', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  const logger = req.app.locals.logger;

  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.values(updates);

    const result = await db.query(
      `UPDATE problems SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error updating problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update problem'
    });
  }
});

// Delete problem
router.delete('/:id', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  const logger = req.app.locals.logger;

  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM problems WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    res.json({
      success: true,
      message: 'Problem deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete problem'
    });
  }
});

export default router;
