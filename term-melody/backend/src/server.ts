/**
 * Term Melody API Server
 * Express 서버 진입점
 */

import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { testConnection } from './config/database.js'
import moodleRoutes from './routes/moodle.routes.js'
import melodyRoutes from './routes/melody.routes.js'

// 환경 변수 로드
dotenv.config()

const app: Application = express()
const PORT = process.env.PORT || 3001
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Middleware
app.use(helmet())
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'term-melody-api',
  })
})

// API Routes
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Term Melody API Server',
    version: '1.0.0',
    endpoints: {
      moodle: '/api/moodle/*',
      melody: '/api/melody/*',
    },
  })
})

// Route handlers
app.use('/api/moodle', moodleRoutes)
app.use('/api/melody', melodyRoutes)

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  })
})

// Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

// 서버 시작
async function startServer() {
  try {
    // 데이터베이스 연결 테스트
    const dbConnected = await testConnection()

    if (!dbConnected) {
      console.warn('⚠️  데이터베이스 연결 실패 - 서버는 계속 실행됩니다')
    }

    app.listen(PORT, () => {
      console.log(`
🎵 Term Melody API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Server running on: http://localhost:${PORT}
✅ Environment: ${process.env.NODE_ENV || 'development'}
✅ CORS enabled for: ${FRONTEND_URL}
${dbConnected ? '✅ Database connected' : '⚠️  Database not connected'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `)
    })
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error)
    process.exit(1)
  }
}

startServer()

export default app
