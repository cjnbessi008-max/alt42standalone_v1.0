/**
 * Scale Sound 백엔드 서버
 * Node.js + Express + MySQL 5.7
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// 라우트 import
const problemsRouter = require('./routes/problems');
const progressRouter = require('./routes/progress');
const moodleRouter = require('./routes/moodle');

// Express 앱 초기화
const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Scale Sound API 서버가 실행 중입니다.',
    timestamp: new Date().toISOString()
  });
});

// API 라우트
app.use('/api/problems', problemsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/moodle', moodleRouter);

// 404 핸들러
app.use(notFound);

// 에러 핸들러
app.use(errorHandler);

// 서버 시작
async function startServer() {
  try {
    // 데이터베이스 연결 테스트
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.warn('⚠️  데이터베이스 연결 실패 - 서버는 계속 실행됩니다.');
    }

    // 서버 시작
    app.listen(PORT, () => {
      console.log('');
      console.log('='.repeat(50));
      console.log('🎵 Scale Sound API 서버 시작');
      console.log('='.repeat(50));
      console.log(`📍 포트: ${PORT}`);
      console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`💚 헬스체크: http://localhost:${PORT}/health`);
      console.log('='.repeat(50));
      console.log('');
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호 수신 - 서버 종료 중...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT 신호 수신 - 서버 종료 중...');
  process.exit(0);
});

// 서버 시작
startServer();
