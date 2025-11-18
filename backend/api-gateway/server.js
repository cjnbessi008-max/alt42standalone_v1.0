import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000

// 미들웨어
app.use(cors())
app.use(express.json())

// 헬스체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Alt42 API is running' })
})

// 트리 생성 (향후 AI 생성 로직 통합)
app.post('/api/tree/generate', (req, res) => {
  const { difficulty = 1 } = req.body

  // 클라이언트에서 생성하므로 여기서는 설정만 반환
  res.json({
    success: true,
    config: {
      difficulty,
      maxDepth: difficulty + 1,
    },
  })
})

// 답변 검증 및 저장
app.post('/api/answer/submit', async (req, res) => {
  const { studentId, moduleId, answer, correctAnswer, difficulty } = req.body

  const isCorrect = answer === correctAnswer

  // 데이터베이스 저장 로직 (향후 구현)
  const submission = {
    id: Date.now(),
    studentId,
    moduleId,
    answer,
    correctAnswer,
    isCorrect,
    difficulty,
    timestamp: new Date().toISOString(),
  }

  console.log('Answer submitted:', submission)

  res.json({
    success: true,
    isCorrect,
    feedback: isCorrect
      ? `정답입니다! 총 ${correctAnswer}개의 가지가 있습니다!`
      : answer < correctAnswer
      ? `조금 더 찾아보세요! 힌트: ${correctAnswer - answer}개가 더 있어요.`
      : `너무 많이 세었어요. 다시 세어보세요!`,
    submission,
  })
})

// 학생 진행 상황 조회
app.get('/api/progress/:studentId', async (req, res) => {
  const { studentId } = req.params

  // 데이터베이스에서 조회 (향후 구현)
  const progress = {
    studentId,
    totalAttempts: 0,
    correctAttempts: 0,
    averageDifficulty: 1,
    lastActivity: new Date().toISOString(),
  }

  res.json(progress)
})

// 리더보드
app.get('/api/leaderboard', async (req, res) => {
  // 데이터베이스에서 조회 (향후 구현)
  const leaderboard = [
    { rank: 1, name: '학생A', score: 95, attempts: 20 },
    { rank: 2, name: '학생B', score: 88, attempts: 18 },
    { rank: 3, name: '학생C', score: 82, attempts: 22 },
  ]

  res.json(leaderboard)
})

// LMS 연동 엔드포인트 (향후 Moodle 연동)
app.post('/api/lms/sync', async (req, res) => {
  const { moduleId, action } = req.body

  // Moodle API 호출 로직 (향후 구현)
  res.json({
    success: true,
    message: 'LMS sync initiated',
    moduleId,
    action,
  })
})

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  })
})

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Alt42 API Gateway running on port ${PORT}`)
  console.log(`📱 Branch Counting Module API ready`)
})
