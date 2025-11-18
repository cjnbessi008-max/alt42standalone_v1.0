const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('./config');
const routes = require('./api/routes');
const moodleService = require('./services/moodleService');

// Express 앱 초기화
const app = express();
const server = http.createServer(app);

// Socket.io 설정
const io = new Server(server, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST']
  }
});

// 미들웨어 설정
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 라우트 등록
app.use('/api', routes);

// 루트 경로
app.get('/', (req, res) => {
  res.json({
    message: 'Accumulation Tower API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      user: '/api/user/:userId',
      accumulation: '/api/accumulation/:userId/:courseId',
      grades: '/api/grades/:userId/:courseId',
      quizzes: '/api/quizzes/:courseId',
      quizAttempts: '/api/quiz-attempts/:quizId/:userId'
    }
  });
});

// 활성 구독 추적
const subscriptions = new Map();

/**
 * Socket.io 연결 처리
 */
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  /**
   * 학생의 점수 실시간 구독
   * @param {object} data - { userId, courseId }
   */
  socket.on('subscribe', async (data) => {
    const { userId, courseId } = data;

    if (!userId || !courseId) {
      socket.emit('error', { message: 'userId and courseId are required' });
      return;
    }

    console.log(`Client ${socket.id} subscribed to user ${userId}, course ${courseId}`);

    // 구독 정보 저장
    const subscriptionKey = `${userId}-${courseId}`;
    if (!subscriptions.has(subscriptionKey)) {
      subscriptions.set(subscriptionKey, new Set());
    }
    subscriptions.get(subscriptionKey).add(socket.id);

    // 소켓에 구독 정보 저장
    socket.userId = userId;
    socket.courseId = courseId;

    // 초기 데이터 전송
    try {
      const towerData = await moodleService.getAccumulationScore(
        parseInt(userId),
        parseInt(courseId)
      );
      socket.emit('tower-update', towerData);
    } catch (error) {
      console.error('Error sending initial data:', error);
      socket.emit('error', { message: 'Failed to fetch initial data' });
    }
  });

  /**
   * 구독 해제
   */
  socket.on('unsubscribe', () => {
    if (socket.userId && socket.courseId) {
      const subscriptionKey = `${socket.userId}-${socket.courseId}`;
      const subscribers = subscriptions.get(subscriptionKey);
      if (subscribers) {
        subscribers.delete(socket.id);
        if (subscribers.size === 0) {
          subscriptions.delete(subscriptionKey);
        }
      }
      console.log(`Client ${socket.id} unsubscribed`);
    }
  });

  /**
   * 수동 새로고침 요청
   */
  socket.on('refresh', async () => {
    if (!socket.userId || !socket.courseId) {
      socket.emit('error', { message: 'Not subscribed to any data' });
      return;
    }

    try {
      const towerData = await moodleService.getAccumulationScore(
        parseInt(socket.userId),
        parseInt(socket.courseId)
      );
      socket.emit('tower-update', towerData);
    } catch (error) {
      console.error('Error refreshing data:', error);
      socket.emit('error', { message: 'Failed to refresh data' });
    }
  });

  /**
   * 연결 해제 처리
   */
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    // 모든 구독에서 제거
    subscriptions.forEach((subscribers, key) => {
      subscribers.delete(socket.id);
      if (subscribers.size === 0) {
        subscriptions.delete(key);
      }
    });
  });
});

/**
 * 주기적 업데이트 (모든 구독자에게 최신 데이터 전송)
 */
setInterval(async () => {
  if (subscriptions.size === 0) return;

  console.log(`Updating ${subscriptions.size} subscriptions...`);

  for (const [key, socketIds] of subscriptions.entries()) {
    const [userId, courseId] = key.split('-').map(Number);

    try {
      const towerData = await moodleService.getAccumulationScore(userId, courseId);

      // 해당 구독의 모든 소켓에 데이터 전송
      socketIds.forEach(socketId => {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('tower-update', towerData);
        }
      });
    } catch (error) {
      console.error(`Error updating subscription ${key}:`, error);
    }
  }
}, config.scoreUpdateInterval);

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined
  });
});

// 서버 시작
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║         🏗️  Accumulation Tower API Server 🏗️           ║
║                                                          ║
║  Server running on: http://localhost:${PORT}              ║
║  Environment: ${config.nodeEnv}                              ║
║  Moodle URL: ${config.moodle.url || 'Not configured'}
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);

  if (!config.moodle.url || !config.moodle.token) {
    console.warn(`
⚠️  WARNING: Moodle configuration is incomplete!
   Please set MOODLE_URL and MOODLE_TOKEN in .env file
    `);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
