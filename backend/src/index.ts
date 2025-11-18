import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import router from './routes/index.js';
import { testConnection } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// 미들웨어
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 세션 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24시간
    },
  })
);

// 라우트
app.use('/', router);

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// 에러 핸들러
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 서버 시작
async function startServer() {
  // 데이터베이스 연결 테스트
  const dbConnected = await testConnection();

  if (!dbConnected) {
    console.warn('⚠️  Warning: Database connection failed. Some features may not work.');
  }

  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🧩 Composition Puzzle Backend Server               ║
║                                                       ║
║   🚀 Server running on: http://localhost:${PORT}      ║
║   📊 Health check: http://localhost:${PORT}/health   ║
║   🔗 LTI Config: http://localhost:${PORT}/lti/config.xml ║
║                                                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
  });
}

startServer();
