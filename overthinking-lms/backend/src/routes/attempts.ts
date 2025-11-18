import express from 'express';
import { prisma } from '../index';

const router = express.Router();

// Start a new attempt
router.post('/start', async (req, res) => {
  try {
    const { studentId, problemId } = req.body;

    if (!studentId || !problemId) {
      return res.status(400).json({ error: 'studentId and problemId are required' });
    }

    // Check if there's an active attempt
    const activeAttempt = await prisma.studentAttempt.findFirst({
      where: {
        studentId,
        problemId,
        submittedAt: null,
      },
    });

    if (activeAttempt) {
      return res.json(activeAttempt);
    }

    // Create new attempt
    const attempt = await prisma.studentAttempt.create({
      data: {
        studentId,
        problemId,
        startedAt: new Date(),
        timeSpentSeconds: 0,
      },
    });

    res.status(201).json(attempt);
  } catch (error) {
    console.error('Error starting attempt:', error);
    res.status(500).json({ error: 'Failed to start attempt' });
  }
});

// Submit an attempt
router.post('/:attemptId/submit', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answer, timeSpent } = req.body;

    const attempt = await prisma.studentAttempt.findUnique({
      where: { id: attemptId },
      include: { problem: true },
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    if (attempt.submittedAt) {
      return res.status(400).json({ error: 'Attempt already submitted' });
    }

    // Check if answer is correct
    const isCorrect = answer.trim().toLowerCase() === attempt.problem.correctAnswer.trim().toLowerCase();

    // Update attempt
    const updatedAttempt = await prisma.studentAttempt.update({
      where: { id: attemptId },
      data: {
        answer,
        isCorrect,
        timeSpentSeconds: timeSpent || 0,
        submittedAt: new Date(),
      },
    });

    // Resolve any overthinking events
    await prisma.overthinkingEvent.updateMany({
      where: {
        attemptId,
        resolvedAt: null,
      },
      data: {
        resolvedAt: new Date(),
        studentResponse: 'completed',
      },
    });

    // Update problem's average solve time (only for correct answers)
    if (isCorrect) {
      const successfulAttempts = await prisma.studentAttempt.findMany({
        where: {
          problemId: attempt.problemId,
          isCorrect: true,
        },
        select: {
          timeSpentSeconds: true,
        },
      });

      const avgTime = Math.round(
        successfulAttempts.reduce((sum, a) => sum + a.timeSpentSeconds, 0) / successfulAttempts.length
      );

      await prisma.problem.update({
        where: { id: attempt.problemId },
        data: { avgSolveTimeSeconds: avgTime },
      });
    }

    res.json({
      ...updatedAttempt,
      isCorrect,
    });
  } catch (error) {
    console.error('Error submitting attempt:', error);
    res.status(500).json({ error: 'Failed to submit attempt' });
  }
});

// Update attempt (for answer modifications)
router.patch('/:attemptId', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answer } = req.body;

    const attempt = await prisma.studentAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    if (attempt.submittedAt) {
      return res.status(400).json({ error: 'Cannot modify submitted attempt' });
    }

    const updatedAttempt = await prisma.studentAttempt.update({
      where: { id: attemptId },
      data: {
        answer,
        answerModifications: attempt.answerModifications + 1,
      },
    });

    res.json(updatedAttempt);
  } catch (error) {
    console.error('Error updating attempt:', error);
    res.status(500).json({ error: 'Failed to update attempt' });
  }
});

// Get student's attempts
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = '20' } = req.query;

    const attempts = await prisma.studentAttempt.findMany({
      where: { studentId },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            difficultyLevel: true,
            problemType: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(attempts);
  } catch (error) {
    console.error('Error fetching attempts:', error);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

export default router;
