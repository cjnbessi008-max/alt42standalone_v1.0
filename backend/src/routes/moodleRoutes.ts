import { Router } from 'express'
import { MoodleController } from '../controllers/MoodleController'
import { validateMoodleToken } from '../middleware/validateMoodleToken'

const router = Router()
const moodleController = new MoodleController()

// All routes require Moodle token
router.use(validateMoodleToken)

// GET /api/moodle/problems - Fetch problems from Moodle
router.get('/problems', moodleController.fetchProblems)

// POST /api/moodle/grade - Send grade to Moodle
router.post('/grade', moodleController.submitGrade)

// GET /api/moodle/courses - Get user's courses
router.get('/courses', moodleController.getCourses)

export default router
