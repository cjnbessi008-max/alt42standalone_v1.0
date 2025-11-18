import express from 'express';
import { prisma } from '../index';
import { BehaviorEventData } from '../types';

const router = express.Router();

// Track a behavior event
router.post('/event', async (req, res) => {
  try {
    const eventData: BehaviorEventData = req.body;

    if (!eventData.studentId || !eventData.problemId || !eventData.eventType) {
      return res.status(400).json({
        error: 'studentId, problemId, and eventType are required',
      });
    }

    const event = await prisma.behaviorEvent.create({
      data: {
        studentId: eventData.studentId,
        problemId: eventData.problemId,
        attemptId: eventData.attemptId,
        eventType: eventData.eventType,
        eventData: eventData.eventData || {},
        timestamp: new Date(),
      },
    });

    res.status(201).json({ success: true, eventId: event.id });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Batch track events (for efficiency)
router.post('/events/batch', async (req, res) => {
  try {
    const { events }: { events: BehaviorEventData[] } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'events array is required' });
    }

    const createdEvents = await prisma.behaviorEvent.createMany({
      data: events.map((e) => ({
        studentId: e.studentId,
        problemId: e.problemId,
        attemptId: e.attemptId,
        eventType: e.eventType,
        eventData: e.eventData || {},
        timestamp: new Date(),
      })),
    });

    res.status(201).json({
      success: true,
      count: createdEvents.count,
    });
  } catch (error) {
    console.error('Error batch tracking events:', error);
    res.status(500).json({ error: 'Failed to batch track events' });
  }
});

// Get behavior events for an attempt
router.get('/attempt/:attemptId', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { limit = '100' } = req.query;

    const events = await prisma.behaviorEvent.findMany({
      where: { attemptId },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching behavior events:', error);
    res.status(500).json({ error: 'Failed to fetch behavior events' });
  }
});

// Get overthinking events for a student
router.get('/overthinking/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = '20', resolved } = req.query;

    const where: any = { studentId };
    if (resolved !== undefined) {
      where.resolvedAt = resolved === 'true' ? { not: null } : null;
    }

    const events = await prisma.overthinkingEvent.findMany({
      where,
      include: {
        problem: {
          select: {
            title: true,
            difficultyLevel: true,
          },
        },
      },
      orderBy: { detectedAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching overthinking events:', error);
    res.status(500).json({ error: 'Failed to fetch overthinking events' });
  }
});

export default router;
