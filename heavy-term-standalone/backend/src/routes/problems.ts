/**
 * Problems API Routes
 */

import { Router, Request, Response } from 'express'
import { prisma } from '../server.js'
import { z } from 'zod'

const router = Router()

// Validation schemas
const createProblemSchema = z.object({
  title: z.string().min(1).max(200),
  questionText: z.string().min(1).max(2000),
  questionType: z.enum(['simplify', 'solve', 'factor', 'expand', 'evaluate']).default('simplify'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).default('medium'),
  category: z.string().optional(),
  terms: z.array(z.object({
    text: z.string().min(1),
    value: z.number().optional(),
    size: z.number().int().min(1).max(10).optional(),
    weight: z.number().optional(),
    isAnswer: z.boolean().default(false),
    order: z.number().int().default(0),
  })).optional(),
})

// GET /api/problems - Get all problems
router.get('/', async (req: Request, res: Response) => {
  try {
    const { difficulty, category, active } = req.query

    const where: any = {}

    if (difficulty) {
      where.difficulty = difficulty as string
    }

    if (category) {
      where.category = category as string
    }

    if (active !== undefined) {
      where.isActive = active === 'true'
    }

    const problems = await prisma.problem.findMany({
      where,
      include: {
        terms: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json({
      success: true,
      data: problems,
      total: problems.length,
    })
  } catch (error) {
    console.error('Error fetching problems:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problems',
    })
  }
})

// GET /api/problems/:id - Get problem by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        terms: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found',
      })
    }

    res.json({
      success: true,
      data: problem,
    })
  } catch (error) {
    console.error('Error fetching problem:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problem',
    })
  }
})

// POST /api/problems - Create new problem
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = createProblemSchema.parse(req.body)

    const { terms, ...problemData } = validated

    const problem = await prisma.problem.create({
      data: {
        ...problemData,
        terms: terms ? {
          create: terms.map((term, index) => ({
            ...term,
            size: term.size || calculateTermSize(term.text),
            weight: term.weight || calculateTermWeight(term.text),
            order: term.order || index,
          })),
        } : undefined,
      },
      include: {
        terms: true,
      },
    })

    res.status(201).json({
      success: true,
      data: problem,
      message: 'Problem created successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
    }

    console.error('Error creating problem:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create problem',
    })
  }
})

// PUT /api/problems/:id - Update problem
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const validated = createProblemSchema.partial().parse(req.body)

    const { terms, ...problemData } = validated

    // Update problem
    const problem = await prisma.problem.update({
      where: { id },
      data: problemData,
      include: {
        terms: true,
      },
    })

    // Update terms if provided
    if (terms) {
      // Delete existing terms
      await prisma.term.deleteMany({
        where: { problemId: id },
      })

      // Create new terms
      await prisma.term.createMany({
        data: terms.map((term, index) => ({
          problemId: id,
          ...term,
          size: term.size || calculateTermSize(term.text),
          weight: term.weight || calculateTermWeight(term.text),
          order: term.order || index,
        })),
      })
    }

    // Fetch updated problem
    const updatedProblem = await prisma.problem.findUnique({
      where: { id },
      include: { terms: true },
    })

    res.json({
      success: true,
      data: updatedProblem,
      message: 'Problem updated successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
    }

    console.error('Error updating problem:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update problem',
    })
  }
})

// DELETE /api/problems/:id - Delete problem
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await prisma.problem.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Problem deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting problem:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete problem',
    })
  }
})

// Helper functions
function calculateTermSize(text: string): number {
  let size = 1

  // Check for exponents
  if (text.includes('^') || text.includes('²') || text.includes('³')) {
    size += 2
  }

  // Check for roots
  if (/[√∛∜]/.test(text)) {
    size += 2
  }

  // Check for fractions
  if (text.includes('/')) {
    size += 1
  }

  // Check for parentheses
  const parenCount = (text.match(/\(/g) || []).length
  size += parenCount

  // Length factor
  if (text.length > 10) {
    size += 2
  } else if (text.length > 5) {
    size += 1
  }

  // Numerical value factor
  const numMatch = text.match(/(\d+)/)
  if (numMatch) {
    const value = parseInt(numMatch[1])
    if (value > 100) {
      size += 2
    } else if (value > 10) {
      size += 1
    }
  }

  return Math.min(10, Math.max(1, size))
}

function calculateTermWeight(text: string): number {
  let weight = 1.0

  const numMatch = text.match(/(\d+\.?\d*)/)
  if (numMatch) {
    const value = parseFloat(numMatch[1])
    weight = 1.0 + Math.log10(Math.max(1, value))
  }

  return Math.round(weight * 100) / 100
}

export default router
