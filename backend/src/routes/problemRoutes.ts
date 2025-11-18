import { Router } from 'express'
import { ProblemController } from '../controllers/ProblemController'

const router = Router()
const problemController = new ProblemController()

// GET /api/problems - Get all problems
router.get('/', problemController.getAllProblems)

// GET /api/problems/:id - Get problem by ID
router.get('/:id', problemController.getProblemById)

// POST /api/problems - Create new problem
router.post('/', problemController.createProblem)

// PUT /api/problems/:id - Update problem
router.put('/:id', problemController.updateProblem)

// DELETE /api/problems/:id - Delete problem
router.delete('/:id', problemController.deleteProblem)

export default router
