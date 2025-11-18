/**
 * Division Problems Routes
 * Handles problem generation and answer validation
 */

const express = require('express')
const router = express.Router()
const db = require('../database/connection')

/**
 * Generate a random division problem
 */
function generateProblem(difficulty = 'medium') {
  let dividend, divisor

  switch (difficulty) {
    case 'easy':
      // Easy: divisible numbers, small values
      divisor = Math.floor(Math.random() * 5) + 2  // 2-6
      const multiplier = Math.floor(Math.random() * 5) + 1  // 1-5
      dividend = divisor * multiplier
      break

    case 'medium':
      // Medium: mix of divisible and indivisible
      divisor = Math.floor(Math.random() * 9) + 2  // 2-10
      dividend = Math.floor(Math.random() * 50) + 10  // 10-59
      break

    case 'hard':
      // Hard: larger numbers, often indivisible
      divisor = Math.floor(Math.random() * 12) + 3  // 3-14
      dividend = Math.floor(Math.random() * 100) + 20  // 20-119
      break

    case 'impossible':
      // Impossible: division by zero or clearly indivisible
      if (Math.random() > 0.5) {
        divisor = 0
        dividend = Math.floor(Math.random() * 20) + 1
      } else {
        divisor = Math.floor(Math.random() * 7) + 3  // 3-9
        dividend = divisor * Math.floor(Math.random() * 5) + 1  // Not divisible
      }
      break

    default:
      divisor = Math.floor(Math.random() * 10) + 1
      dividend = Math.floor(Math.random() * 50) + 1
  }

  const isImpossible = divisor === 0 || dividend % divisor !== 0
  const quotient = divisor === 0 ? null : Math.floor(dividend / divisor)
  const remainder = divisor === 0 ? null : dividend % divisor

  return {
    id: Date.now(),
    dividend,
    divisor,
    quotient,
    remainder,
    isImpossible,
    difficulty,
    type: 'division',
    showShadow: isImpossible
  }
}

/**
 * GET /api/problems/next
 * Get next problem for student
 */
router.get('/next', async (req, res) => {
  try {
    const { studentId, difficulty } = req.query
    const problem = generateProblem(difficulty)

    // Save to database
    if (studentId) {
      await db.query(
        'INSERT INTO problems (id, student_id, dividend, divisor, difficulty, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [problem.id, studentId, problem.dividend, problem.divisor, problem.difficulty]
      )
    }

    res.json({
      success: true,
      data: problem
    })
  } catch (error) {
    console.error('Error generating problem:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/problems/answer
 * Submit and validate answer
 */
router.post('/answer', async (req, res) => {
  try {
    const { problemId, studentId, answer, dividend, divisor } = req.body

    // Validate answer
    let correct = false
    let feedback = ''

    if (divisor === 0) {
      // Division by zero
      correct = answer.toLowerCase() === 'impossible' || answer.toLowerCase() === '불가능'
      feedback = correct
        ? '정답입니다! 0으로 나눌 수 없습니다.'
        : '0으로 나누는 것은 불가능합니다.'
    } else {
      const correctAnswer = Math.floor(dividend / divisor)
      const remainder = dividend % divisor

      if (remainder !== 0) {
        // Indivisible
        correct = parseInt(answer) === correctAnswer
        feedback = correct
          ? `정답입니다! 몫은 ${correctAnswer}이고 나머지는 ${remainder}입니다.`
          : `다시 생각해보세요. 나머지가 ${remainder} 남습니다.`
      } else {
        // Divisible
        correct = parseInt(answer) === correctAnswer
        feedback = correct
          ? '정답입니다! 정확히 나누어떨어집니다.'
          : `다시 생각해보세요. 정답은 ${correctAnswer}입니다.`
      }
    }

    // Save answer to database
    if (studentId && problemId) {
      await db.query(
        'INSERT INTO answers (problem_id, student_id, answer, correct, submitted_at) VALUES (?, ?, ?, ?, NOW())',
        [problemId, studentId, answer, correct]
      )
    }

    res.json({
      success: true,
      data: {
        correct,
        feedback,
        correctAnswer: divisor === 0 ? 'impossible' : Math.floor(dividend / divisor),
        remainder: divisor === 0 ? null : dividend % divisor
      }
    })
  } catch (error) {
    console.error('Error validating answer:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/problems/student/:id/history
 * Get problem history for student
 */
router.get('/student/:id/history', async (req, res) => {
  try {
    const studentId = req.params.id
    const { limit = 10 } = req.query

    const [rows] = await db.query(
      `SELECT p.*, a.answer, a.correct, a.submitted_at
       FROM problems p
       LEFT JOIN answers a ON p.id = a.problem_id
       WHERE p.student_id = ?
       ORDER BY p.created_at DESC
       LIMIT ?`,
      [studentId, parseInt(limit)]
    )

    res.json({
      success: true,
      data: rows
    })
  } catch (error) {
    console.error('Error fetching history:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/problems/stats
 * Get overall statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { studentId } = req.query

    const [stats] = await db.query(
      `SELECT
        COUNT(*) as total_problems,
        SUM(CASE WHEN a.correct = 1 THEN 1 ELSE 0 END) as correct_answers,
        AVG(CASE WHEN a.correct = 1 THEN 1 ELSE 0 END) * 100 as accuracy
       FROM problems p
       LEFT JOIN answers a ON p.id = a.problem_id
       WHERE p.student_id = ?`,
      [studentId]
    )

    res.json({
      success: true,
      data: stats[0]
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

module.exports = router
