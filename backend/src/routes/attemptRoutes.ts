import { Router } from 'express'
import { AttemptController } from '../controllers/AttemptController'

const router = Router()
const attemptController = new AttemptController()

// POST /api/attempts - Submit new attempt
router.post('/', attemptController.submitAttempt)

// GET /api/attempts/student/:studentId - Get attempts by student
router.get('/student/:studentId', attemptController.getAttemptsByStudent)

// GET /api/attempts/problem/:problemId - Get attempts for a problem
router.get('/problem/:problemId', attemptController.getAttemptsByProblem)

// GET /api/attempts/:id - Get attempt by ID
router.get('/:id', attemptController.getAttemptById)

export default router
