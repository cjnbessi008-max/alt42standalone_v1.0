import { Router, Request, Response } from 'express';
import db from '../database';

const router = Router();

interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  subject: string;
  priority_flag: string | null;
  created_at: string;
  updated_at: string;
}

// GET all problems with optional filtering
router.get('/', (req: Request, res: Response) => {
  try {
    const { priority, difficulty, subject, sort } = req.query;

    let query = 'SELECT * FROM problems WHERE 1=1';
    const params: any[] = [];

    if (priority) {
      query += ' AND priority_flag = ?';
      params.push(priority);
    }

    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    if (subject) {
      query += ' AND subject = ?';
      params.push(subject);
    }

    // Sorting
    if (sort === 'priority') {
      query += ' ORDER BY CASE priority_flag WHEN "important" THEN 1 WHEN "solve_first" THEN 2 WHEN "review" THEN 3 ELSE 4 END';
    } else if (sort === 'difficulty') {
      query += ' ORDER BY CASE difficulty WHEN "easy" THEN 1 WHEN "medium" THEN 2 WHEN "hard" THEN 3 END';
    } else {
      query += ' ORDER BY created_at DESC';
    }

    const problems = db.prepare(query).all(...params);
    res.json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// GET single problem
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(id);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json(problem);
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

// POST create new problem
router.post('/', (req: Request, res: Response) => {
  try {
    const { title, description, difficulty, subject, priority_flag } = req.body;

    if (!title || !description || !difficulty || !subject) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = db.prepare(`
      INSERT INTO problems (title, description, difficulty, subject, priority_flag)
      VALUES (?, ?, ?, ?, ?)
    `).run(title, description, difficulty, subject, priority_flag || null);

    const newProblem = db.prepare('SELECT * FROM problems WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newProblem);
  } catch (error) {
    console.error('Error creating problem:', error);
    res.status(500).json({ error: 'Failed to create problem' });
  }
});

// PATCH update problem priority
router.patch('/:id/priority', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { priority_flag } = req.body;

    const validPriorities = ['important', 'solve_first', 'review', null];
    if (priority_flag !== undefined && !validPriorities.includes(priority_flag)) {
      return res.status(400).json({ error: 'Invalid priority flag' });
    }

    db.prepare(`
      UPDATE problems
      SET priority_flag = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(priority_flag, id);

    const updatedProblem = db.prepare('SELECT * FROM problems WHERE id = ?').get(id);
    res.json(updatedProblem);
  } catch (error) {
    console.error('Error updating priority:', error);
    res.status(500).json({ error: 'Failed to update priority' });
  }
});

// DELETE problem
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM problems WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    console.error('Error deleting problem:', error);
    res.status(500).json({ error: 'Failed to delete problem' });
  }
});

// GET statistics
router.get('/stats/summary', (req: Request, res: Response) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM problems').get() as { count: number },
      by_priority: db.prepare(`
        SELECT priority_flag, COUNT(*) as count
        FROM problems
        GROUP BY priority_flag
      `).all(),
      by_difficulty: db.prepare(`
        SELECT difficulty, COUNT(*) as count
        FROM problems
        GROUP BY difficulty
      `).all(),
      by_subject: db.prepare(`
        SELECT subject, COUNT(*) as count
        FROM problems
        GROUP BY subject
      `).all()
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
