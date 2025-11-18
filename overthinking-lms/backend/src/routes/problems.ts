import express from 'express';
import { prisma } from '../index';

const router = express.Router();

// Get all problems
router.get('/', async (req, res) => {
  try {
    const { difficulty, type, limit = '20' } = req.query;

    const where: any = {};
    if (difficulty) where.difficultyLevel = parseInt(difficulty as string);
    if (type) where.problemType = type;

    const problems = await prisma.problem.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        difficultyLevel: true,
        problemType: true,
        avgSolveTimeSeconds: true,
        createdAt: true,
      },
    });

    res.json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// Get single problem
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await prisma.problem.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        difficultyLevel: true,
        problemType: true,
        avgSolveTimeSeconds: true,
        hints: true,
        createdAt: true,
      },
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json(problem);
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

// Get hints for a problem
router.get('/:id/hints/:level', async (req, res) => {
  try {
    const { id, level } = req.params;

    const problem = await prisma.problem.findUnique({
      where: { id },
      select: { hints: true },
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const hints = problem.hints as any[];
    const hint = hints?.find((h) => h.level === parseInt(level));

    if (!hint) {
      return res.status(404).json({ error: 'Hint not found' });
    }

    res.json(hint);
  } catch (error) {
    console.error('Error fetching hint:', error);
    res.status(500).json({ error: 'Failed to fetch hint' });
  }
});

// Create problem (admin/teacher only - simplified for now)
router.post('/', async (req, res) => {
  try {
    const { title, description, difficultyLevel, problemType, correctAnswer, hints } = req.body;

    const problem = await prisma.problem.create({
      data: {
        title,
        description,
        difficultyLevel: difficultyLevel || 3,
        problemType: problemType || 'short_answer',
        correctAnswer,
        hints: hints || [],
      },
    });

    res.status(201).json(problem);
  } catch (error) {
    console.error('Error creating problem:', error);
    res.status(500).json({ error: 'Failed to create problem' });
  }
});

export default router;
