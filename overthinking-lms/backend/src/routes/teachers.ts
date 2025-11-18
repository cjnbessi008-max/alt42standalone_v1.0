import express from 'express';
import { prisma } from '../index';

const router = express.Router();

// Get teacher's students
router.get('/:teacherId/students', async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                gradeLevel: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json(teacher.students.map((ts) => ts.student));
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Assign student to teacher
router.post('/:teacherId/students/:studentId', async (req, res) => {
  try {
    const { teacherId, studentId } = req.params;

    const assignment = await prisma.teacherStudent.create({
      data: {
        teacherId,
        studentId,
      },
    });

    res.status(201).json(assignment);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Student already assigned to teacher' });
    }
    console.error('Error assigning student:', error);
    res.status(500).json({ error: 'Failed to assign student' });
  }
});

// Get real-time alerts for teacher's students
router.get('/:teacherId/alerts', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { resolved = 'false', limit = '20' } = req.query;

    // Get teacher's students
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        students: {
          select: { studentId: true },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const studentIds = teacher.students.map((ts) => ts.studentId);

    const where: any = {
      studentId: { in: studentIds },
      recommendation: { in: ['hint', 'alert_teacher'] },
    };

    if (resolved === 'false') {
      where.resolvedAt = null;
    }

    const alerts = await prisma.overthinkingEvent.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        problem: {
          select: {
            id: true,
            title: true,
            difficultyLevel: true,
          },
        },
        attempt: {
          select: {
            id: true,
            timeSpentSeconds: true,
            answerModifications: true,
          },
        },
      },
      orderBy: { detectedAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get analytics for teacher's students
router.get('/:teacherId/analytics', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { startDate, endDate } = req.query;

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        students: {
          select: { studentId: true },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const studentIds = teacher.students.map((ts) => ts.studentId);

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    const where: any = { studentId: { in: studentIds } };
    if (Object.keys(dateFilter).length > 0) {
      where.detectedAt = dateFilter;
    }

    // Get overthinking statistics
    const overthinkingEvents = await prisma.overthinkingEvent.findMany({
      where,
      include: {
        student: { select: { id: true, name: true } },
        problem: { select: { id: true, title: true, difficultyLevel: true } },
      },
    });

    // Get attempt statistics
    const attempts = await prisma.studentAttempt.findMany({
      where: {
        studentId: { in: studentIds },
        ...(Object.keys(dateFilter).length > 0 && { startedAt: dateFilter }),
      },
      include: {
        problem: { select: { difficultyLevel: true, problemType: true } },
      },
    });

    // Calculate metrics
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter((a) => a.submittedAt).length;
    const correctAttempts = attempts.filter((a) => a.isCorrect).length;
    const avgTimeSpent = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.timeSpentSeconds, 0) / attempts.length)
      : 0;

    const overthinkingRate = totalAttempts > 0
      ? ((overthinkingEvents.length / totalAttempts) * 100).toFixed(1)
      : '0.0';

    // Group by student
    const studentMetrics = studentIds.map((studentId) => {
      const studentAttempts = attempts.filter((a) => a.studentId === studentId);
      const studentOverthinking = overthinkingEvents.filter((e) => e.studentId === studentId);

      return {
        studentId,
        studentName: teacher.students.find((s) => s.studentId === studentId),
        totalAttempts: studentAttempts.length,
        correctAnswers: studentAttempts.filter((a) => a.isCorrect).length,
        overthinkingCount: studentOverthinking.length,
        avgTimeSpent: studentAttempts.length > 0
          ? Math.round(studentAttempts.reduce((sum, a) => sum + a.timeSpentSeconds, 0) / studentAttempts.length)
          : 0,
      };
    });

    res.json({
      overview: {
        totalAttempts,
        completedAttempts,
        correctAttempts,
        avgTimeSpent,
        overthinkingRate: parseFloat(overthinkingRate),
        totalOverthinkingEvents: overthinkingEvents.length,
      },
      studentMetrics,
      recentOverthinking: overthinkingEvents.slice(0, 10),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
