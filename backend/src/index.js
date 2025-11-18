import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import problemsRouter from './routes/problems.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// 미들웨어
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// API 라우트
app.use('/api/problems', problemsRouter)

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// 서버 시작
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  🚀 Shape Summary Backend Server          ║
║                                            ║
║  📡 Server: http://localhost:${PORT}       ║
║  🌐 Environment: ${process.env.NODE_ENV || 'development'}            ║
║  ⏰ Started: ${new Date().toLocaleString('ko-KR')}     ║
╚════════════════════════════════════════════╝
  `)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
  })
})

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server')
  process.exit(0)
})
