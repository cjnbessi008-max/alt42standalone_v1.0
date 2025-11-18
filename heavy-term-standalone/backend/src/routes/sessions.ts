/**
 * Sessions API Routes
 */

import { Router, Request, Response } from 'express'
import { prisma } from '../server.js'
import { z } from 'zod'

const router = Router()

// Validation schemas
const createSessionSchema = z.object({
  problemId: z.string().uuid(),
  userId: z.string().optional(),
  deviceType: z.enum(['smartphone', 'tablet', 'desktop']).default('smartphone'),
})

// POST /api/sessions - Create new session
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = createSessionSchema.parse(req.body)

    const session = await prisma.session.create({
      data: validated,
      include: {
        problem: {
          include: {
            terms: true,
          },
        },
      },
    })

    res.status(201).json({
      success: true,
      data: session,
      message: 'Session created successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
    }

    console.error('Error creating session:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create session',
    })
  }
})

// GET /api/sessions/:id - Get session by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        problem: {
          include: {
            terms: true,
          },
        },
        interactions: {
          orderBy: { timestamp: 'asc' },
        },
        answer: true,
      },
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      })
    }

    res.json({
      success: true,
      data: session,
    })
  } catch (error) {
    console.error('Error fetching session:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session',
    })
  }
})

// PUT /api/sessions/:id/end - End session
router.put('/:id/end', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const session = await prisma.session.update({
      where: { id },
      data: {
        endedAt: new Date(),
        isActive: false,
      },
    })

    res.json({
      success: true,
      data: session,
      message: 'Session ended successfully',
    })
  } catch (error) {
    console.error('Error ending session:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to end session',
    })
  }
})

export default router
