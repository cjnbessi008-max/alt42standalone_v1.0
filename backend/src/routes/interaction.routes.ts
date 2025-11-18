import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

// Get all interactions
router.get('/', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  const logger = req.app.locals.logger;

  try {
    const { studentId, problemId, startDate, endDate } = req.query;

    let query = 'SELECT * FROM student_interactions WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (studentId) {
      query += ` AND student_id = $${paramCount}`;
      params.push(studentId);
      paramCount++;
    }

    if (problemId) {
      query += ` AND problem_id = $${paramCount}`;
      params.push(problemId);
      paramCount++;
    }

    if (startDate) {
      query += ` AND timestamp >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND timestamp <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    query += ' ORDER BY timestamp DESC LIMIT 100';

    const result = await db.query(query, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching interactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interactions'
    });
  }
});

// Get interaction statistics
router.get('/stats/:studentId', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  const logger = req.app.locals.logger;

  try {
    const { studentId } = req.params;

    const statsQuery = `
      SELECT
        COUNT(*) as total_interactions,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
        SUM(CASE WHEN NOT is_correct THEN 1 ELSE 0 END) as wrong_count,
        ROUND(AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100, 2) as accuracy_percentage
      FROM student_interactions
      WHERE student_id = $1
    `;

    const wrongMoveQuery = `
      SELECT
        COUNT(*) as total_wrong_moves,
        AVG(CASE
          WHEN severity = 'high' THEN 3
          WHEN severity = 'medium' THEN 2
          WHEN severity = 'low' THEN 1
        END) as avg_severity
      FROM wrong_move_events wme
      JOIN student_interactions si ON wme.problem_id = si.problem_id
      WHERE si.student_id = $1
    `;

    const [statsResult, wrongMoveResult] = await Promise.all([
      db.query(statsQuery, [studentId]),
      db.query(wrongMoveQuery, [studentId])
    ]);

    res.json({
      success: true,
      data: {
        ...statsResult.rows[0],
        ...wrongMoveResult.rows[0]
      }
    });
  } catch (error) {
    logger.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Get wrong move events
router.get('/wrong-moves', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  const logger = req.app.locals.logger;

  try {
    const { problemId, severity, startDate, endDate } = req.query;

    let query = 'SELECT * FROM wrong_move_events WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (problemId) {
      query += ` AND problem_id = $${paramCount}`;
      params.push(problemId);
      paramCount++;
    }

    if (severity) {
      query += ` AND severity = $${paramCount}`;
      params.push(severity);
      paramCount++;
    }

    if (startDate) {
      query += ` AND timestamp >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND timestamp <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    query += ' ORDER BY timestamp DESC LIMIT 100';

    const result = await db.query(query, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching wrong moves:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wrong moves'
    });
  }
});

export default router;
