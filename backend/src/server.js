/**
 * Main Server
 * Express + WebSocket 서버
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const CalmModeService = require('./integration/calm-mode-service');
const WebSocketHandler = require('./integration/websocket-handler');

// 환경 변수 로드
require('dotenv').config();

// Express 앱 생성
const app = express();
const server = http.createServer(app);

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 서비스 설정
const config = {
  moodle: {
    mysql: {
      host: process.env.MOODLE_DB_HOST || 'localhost',
      port: parseInt(process.env.MOODLE_DB_PORT || '3306'),
      user: process.env.MOODLE_DB_USER || 'moodle',
      password: process.env.MOODLE_DB_PASSWORD || '',
      database: process.env.MOODLE_DB_NAME || 'moodle'
    },
    moodle: {
      baseUrl: process.env.MOODLE_URL || 'http://localhost',
      wsToken: process.env.MOODLE_WS_TOKEN || ''
    }
  },
  brainMonitor: {
    thresholds: {
      sessionDuration: parseInt(process.env.BRAIN_SESSION_DURATION || '2700'), // 45분
      activityFrequency: parseInt(process.env.BRAIN_ACTIVITY_FREQUENCY || '30'),
      errorRate: parseFloat(process.env.BRAIN_ERROR_RATE || '0.5'),
      responseTime: parseInt(process.env.BRAIN_RESPONSE_TIME || '15'),
      cognitiveLoad: parseFloat(process.env.BRAIN_COGNITIVE_LOAD || '0.75')
    },
    checkInterval: parseInt(process.env.BRAIN_CHECK_INTERVAL || '60000') // 1분
  },
  syncInterval: parseInt(process.env.SYNC_INTERVAL || '30000') // 30초
};

// Calm Mode Service 초기화
const calmModeService = new CalmModeService(config);

// WebSocket Handler 초기화
const wsHandler = new WebSocketHandler(server, calmModeService);

// REST API 라우트
app.get('/', (req, res) => {
  res.json({
    service: 'Calm Mode Integration Service',
    version: '1.0.0',
    status: 'running'
  });
});

// 헬스 체크
app.get('/health', async (req, res) => {
  try {
    const health = await calmModeService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// 사용자 상태 조회 (REST API)
app.get('/api/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const status = await calmModeService.getUserStatus(parseInt(userId));

    if (!status) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 안정 모드 토글 (REST API)
app.post('/api/users/:userId/calm-mode', async (req, res) => {
  try {
    const { userId } = req.params;
    const { enabled } = req.body;

    await calmModeService.toggleCalmMode(parseInt(userId), enabled);

    res.json({ success: true, enabled });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 활동 기록 (REST API)
app.post('/api/users/:userId/activities', async (req, res) => {
  try {
    const { userId } = req.params;
    const activity = req.body;

    const brainState = await calmModeService.recordActivity(parseInt(userId), activity);

    res.json({ success: true, brainState });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('✗ 서버 오류:', err);
  res.status(500).json({ error: err.message });
});

// 서버 시작
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Calm Mode Service 초기화
    await calmModeService.initialize();

    // 서버 시작
    server.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('🚀 Calm Mode Integration Service');
      console.log('='.repeat(60));
      console.log(`✓ HTTP Server: http://localhost:${PORT}`);
      console.log(`✓ WebSocket Server: ws://localhost:${PORT}`);
      console.log(`✓ Moodle DB: ${config.moodle.mysql.host}:${config.moodle.mysql.port}`);
      console.log('='.repeat(60));
    });

    // Graceful shutdown
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('✗ 서버 시작 실패:', error);
    process.exit(1);
  }
}

async function shutdown() {
  console.log('\n🔄 서버 종료 중...');

  try {
    // WebSocket 서버 종료
    wsHandler.close();

    // Calm Mode Service 종료
    await calmModeService.shutdown();

    // HTTP 서버 종료
    server.close(() => {
      console.log('✓ 서버 종료 완료');
      process.exit(0);
    });

    // 10초 후 강제 종료
    setTimeout(() => {
      console.error('✗ 강제 종료');
      process.exit(1);
    }, 10000);

  } catch (error) {
    console.error('✗ 종료 중 오류:', error);
    process.exit(1);
  }
}

// 서버 시작
start();

module.exports = { app, server, calmModeService };
