/**
 * Core Integral Highlighting System - Backend Server
 * Moodle 3.7, PHP 7.1.9, MySQL 5.7 환경과 연동
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import problemsRouter from './routes/problems.js';

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 라우트
app.use('/api/problems', problemsRouter);

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Core Integral Highlighting API',
  });
});

// 루트 엔드포인트
app.get('/', (req, res) => {
  res.json({
    message: 'Core Integral Highlighting API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      problems: '/api/problems',
      analyze: '/api/problems/analyze',
      samples: '/api/problems/sample/list',
      rules: '/api/problems/rules/all',
    },
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '요청한 엔드포인트를 찾을 수 없습니다.',
  });
});

// 에러 핸들러
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('서버 에러:', err);
  res.status(500).json({
    success: false,
    error: '서버 내부 오류가 발생했습니다.',
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  Core Integral Highlighting Server');
  console.log('========================================');
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📡 API 엔드포인트: http://localhost:${PORT}`);
  console.log(`🏥 헬스 체크: http://localhost:${PORT}/health`);
  console.log('========================================');
});

export default app;
