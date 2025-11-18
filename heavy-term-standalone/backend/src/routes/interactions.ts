/**
 * Interactions API Routes
 */

import { Router, Request, Response } from 'express'
import { prisma } from '../server.js'
import { z } from 'zod'

const router = Router()

// Validation schema
const createInteractionSchema = z.object({
  sessionId: z.string().uuid(),
  termId: z.string().uuid(),
  type: z.enum(['tap', 'drag', 'drop', 'release', 'collision']),
  positionX: z.number().int().optional(),
  positionY: z.number().int().optional(),
  metadata: z.record(z.any()).optional(),
})

// POST /api/interactions - Log interaction
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = createInteractionSchema.parse(req.body)

    const interaction = await prisma.interaction.create({
      data: {
        ...validated,
        metadata: validated.metadata ? JSON.stringify(validated.metadata) : undefined,
      },
    })

    // Update session interaction count
    await prisma.session.update({
      where: { id: validated.sessionId },
      data: {
        interactionCount: {
          increment: 1,
        },
      },
    })

    res.status(201).json({
      success: true,
      data: interaction,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
    }

    console.error('Error logging interaction:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to log interaction',
    })
  }
})

export default router
