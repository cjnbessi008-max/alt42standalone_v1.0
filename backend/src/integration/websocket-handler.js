/**
 * WebSocket Handler
 * 실시간 뇌 상태 모니터링 및 안정 모드 제어를 위한 WebSocket 핸들러
 */

const WebSocket = require('ws');

class WebSocketHandler {
  constructor(server, calmModeService) {
    this.wss = new WebSocket.Server({ server });
    this.calmModeService = calmModeService;

    this.setupWebSocketServer();
  }

  /**
   * WebSocket 서버 설정
   */
  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      console.log('📡 새로운 WebSocket 연결');

      let userId = null;

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleMessage(ws, data, (id) => { userId = id; });
        } catch (error) {
          console.error('✗ WebSocket 메시지 처리 오류:', error.message);
          ws.send(JSON.stringify({
            type: 'error',
            message: error.message
          }));
        }
      });

      ws.on('close', async () => {
        console.log('📡 WebSocket 연결 종료');
        if (userId) {
          await this.calmModeService.endUserSession(userId);
        }
      });

      ws.on('error', (error) => {
        console.error('✗ WebSocket 오류:', error.message);
      });
    });

    console.log('✓ WebSocket 서버 시작');
  }

  /**
   * 메시지 처리
   */
  async handleMessage(ws, data, setUserId) {
    switch (data.type) {
      case 'auth':
        await this.handleAuth(ws, data, setUserId);
        break;

      case 'activity':
        await this.handleActivity(ws, data);
        break;

      case 'toggle_calm_mode':
        await this.handleToggleCalmMode(ws, data);
        break;

      case 'get_status':
        await this.handleGetStatus(ws, data);
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${data.type}`
        }));
    }
  }

  /**
   * 인증 처리
   */
  async handleAuth(ws, data, setUserId) {
    const { userId } = data;

    if (!userId) {
      throw new Error('userId is required');
    }

    // 세션 시작
    const userInfo = await this.calmModeService.startUserSession(userId, ws);

    setUserId(userId);

    ws.send(JSON.stringify({
      type: 'auth_success',
      user: userInfo
    }));
  }

  /**
   * 활동 기록 처리
   */
  async handleActivity(ws, data) {
    const { userId, activity } = data;

    if (!userId || !activity) {
      throw new Error('userId and activity are required');
    }

    const brainState = await this.calmModeService.recordActivity(userId, activity);

    ws.send(JSON.stringify({
      type: 'activity_recorded',
      brainState
    }));
  }

  /**
   * 안정 모드 토글 처리
   */
  async handleToggleCalmMode(ws, data) {
    const { userId, enabled } = data;

    if (!userId || enabled === undefined) {
      throw new Error('userId and enabled are required');
    }

    await this.calmModeService.toggleCalmMode(userId, enabled);

    ws.send(JSON.stringify({
      type: 'calm_mode_toggled',
      enabled
    }));
  }

  /**
   * 상태 조회 처리
   */
  async handleGetStatus(ws, data) {
    const { userId } = data;

    if (!userId) {
      throw new Error('userId is required');
    }

    const status = await this.calmModeService.getUserStatus(userId);

    ws.send(JSON.stringify({
      type: 'status',
      status
    }));
  }

  /**
   * 서버 종료
   */
  close() {
    this.wss.close(() => {
      console.log('✓ WebSocket 서버 종료');
    });
  }
}

module.exports = WebSocketHandler;
