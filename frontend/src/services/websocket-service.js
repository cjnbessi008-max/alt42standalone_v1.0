/**
 * WebSocket Service
 * 백엔드와의 실시간 통신 서비스
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.userId = null;
    this.reconnectTimer = null;
    this.reconnectDelay = 3000; // 3초
    this.maxReconnectDelay = 30000; // 30초
    this.listeners = new Map();
    this.connected = false;
  }

  /**
   * 연결
   */
  connect(wsUrl, userId) {
    if (this.ws && this.connected) {
      console.log('✓ 이미 연결되어 있습니다');
      return;
    }

    this.userId = userId;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✓ WebSocket 연결됨');
      this.connected = true;
      this.reconnectDelay = 3000; // 재연결 딜레이 초기화

      // 인증
      this.send({
        type: 'auth',
        userId: this.userId
      });

      this.emit('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('✗ 메시지 파싱 오류:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('✗ WebSocket 오류:', error);
      this.emit('error', error);
    };

    this.ws.onclose = () => {
      console.log('✗ WebSocket 연결 종료');
      this.connected = false;
      this.emit('disconnected');

      // 자동 재연결
      this.scheduleReconnect(wsUrl, userId);
    };
  }

  /**
   * 재연결 스케줄
   */
  scheduleReconnect(wsUrl, userId) {
    if (this.reconnectTimer) {
      return;
    }

    console.log(`🔄 ${this.reconnectDelay / 1000}초 후 재연결 시도...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(wsUrl, userId);

      // 재연결 딜레이 증가 (지수 백오프)
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay
      );
    }, this.reconnectDelay);
  }

  /**
   * 연결 종료
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
    this.userId = null;
  }

  /**
   * 메시지 전송
   */
  send(data) {
    if (!this.ws || !this.connected) {
      console.error('✗ WebSocket이 연결되지 않았습니다');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('✗ 메시지 전송 실패:', error);
      return false;
    }
  }

  /**
   * 메시지 처리
   */
  handleMessage(data) {
    console.log('📨 메시지 수신:', data.type);

    switch (data.type) {
      case 'auth_success':
        this.emit('auth_success', data.user);
        break;

      case 'session_started':
        this.emit('session_started', data);
        break;

      case 'brain_status_update':
        this.emit('brain_status_update', data.status);
        break;

      case 'calm_mode_activate':
        this.emit('calm_mode_activate', data);
        break;

      case 'calm_mode_deactivate':
        this.emit('calm_mode_deactivate', data);
        break;

      case 'activity_recorded':
        this.emit('activity_recorded', data.brainState);
        break;

      case 'calm_mode_toggled':
        this.emit('calm_mode_toggled', data.enabled);
        break;

      case 'status':
        this.emit('status', data.status);
        break;

      case 'error':
        console.error('✗ 서버 오류:', data.message);
        this.emit('error', data.message);
        break;

      case 'pong':
        // Ping-pong for keep-alive
        break;

      default:
        console.warn('⚠️  알 수 없는 메시지 타입:', data.type);
    }
  }

  /**
   * 활동 기록
   */
  recordActivity(activity) {
    return this.send({
      type: 'activity',
      userId: this.userId,
      activity: {
        type: activity.type,
        courseId: activity.courseId,
        activityId: activity.activityId,
        isError: activity.isError || false,
        responseTime: activity.responseTime || null
      }
    });
  }

  /**
   * 안정 모드 토글
   */
  toggleCalmMode(enabled) {
    return this.send({
      type: 'toggle_calm_mode',
      userId: this.userId,
      enabled
    });
  }

  /**
   * 상태 조회
   */
  getStatus() {
    return this.send({
      type: 'get_status',
      userId: this.userId
    });
  }

  /**
   * 이벤트 리스너 등록
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * 이벤트 리스너 제거
   */
  off(event, callback) {
    if (!this.listeners.has(event)) {
      return;
    }

    const listeners = this.listeners.get(event);
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * 이벤트 발생
   */
  emit(event, data) {
    if (!this.listeners.has(event)) {
      return;
    }

    const listeners = this.listeners.get(event);
    for (const callback of listeners) {
      try {
        callback(data);
      } catch (error) {
        console.error(`✗ 이벤트 핸들러 오류 (${event}):`, error);
      }
    }
  }

  /**
   * Ping 전송 (연결 유지)
   */
  ping() {
    return this.send({ type: 'ping' });
  }

  /**
   * Keep-alive 시작
   */
  startKeepAlive(interval = 30000) {
    this.stopKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      this.ping();
    }, interval);
  }

  /**
   * Keep-alive 중지
   */
  stopKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }
}

// 싱글톤 인스턴스
const wsService = new WebSocketService();

export default wsService;
