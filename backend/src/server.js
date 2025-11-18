import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import moodleRoutes from './routes/moodle.js';
import conditionRoutes from './routes/conditions.js';
import scanHistoryRoutes from './routes/scanHistory.js';
import { testConnection } from './services/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로깅
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 라우트
app.use('/api/moodle', moodleRoutes);
app.use('/api/conditions', conditionRoutes);
app.use('/api/scan-history', scanHistoryRoutes);

// 헬스체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not Found' } });
});

// 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 연결 테스트
    await testConnection();
    console.log('✓ MySQL 데이터베이스 연결 성공');

    app.listen(PORT, () => {
      console.log(`\n🚀 서버가 시작되었습니다!`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`🌍 환경: ${process.env.NODE_ENV}`);
      console.log(`\n사용 가능한 엔드포인트:`);
      console.log(`  - GET  /api/health`);
      console.log(`  - GET  /api/moodle/test`);
      console.log(`  - GET  /api/moodle/activities/:courseId`);
      console.log(`  - GET  /api/conditions/:activityId`);
      console.log(`  - POST /api/conditions/:activityId`);
      console.log(`  - POST /api/scan-history\n`);
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully');
  process.exit(0);
});
