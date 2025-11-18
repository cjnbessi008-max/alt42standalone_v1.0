import { io } from 'socket.io-client';

/**
 * Socket.io 서비스
 * 실시간 타워 데이터 업데이트를 위한 WebSocket 통신
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  /**
   * 소켓 연결
   * @param {string} serverUrl - 서버 URL (기본: http://localhost:3001)
   */
  connect(serverUrl = 'http://localhost:3001') {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
      this.emit('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emit('error', error);
    });

    this.socket.on('tower-update', (data) => {
      console.log('Tower update received:', data);
      this.emit('tower-update', data);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });
  }

  /**
   * 사용자 점수 구독
   * @param {number} userId - 사용자 ID
   * @param {number} courseId - 코스 ID
   */
  subscribe(userId, courseId) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return;
    }

    console.log(`Subscribing to user ${userId}, course ${courseId}`);
    this.socket.emit('subscribe', { userId, courseId });
  }

  /**
   * 구독 해제
   */
  unsubscribe() {
    if (!this.socket || !this.isConnected) {
      return;
    }

    console.log('Unsubscribing');
    this.socket.emit('unsubscribe');
  }

  /**
   * 수동 새로고침 요청
   */
  refresh() {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Requesting refresh');
    this.socket.emit('refresh');
  }

  /**
   * 이벤트 리스너 등록
   * @param {string} event - 이벤트 이름
   * @param {function} callback - 콜백 함수
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * 이벤트 리스너 제거
   * @param {string} event - 이벤트 이름
   * @param {function} callback - 콜백 함수
   */
  off(event, callback) {
    if (!this.listeners.has(event)) {
      return;
    }

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * 이벤트 발생
   * @param {string} event - 이벤트 이름
   * @param {*} data - 이벤트 데이터
   */
  emit(event, data) {
    if (!this.listeners.has(event)) {
      return;
    }

    this.listeners.get(event).forEach(callback => {
      callback(data);
    });
  }

  /**
   * 소켓 연결 해제
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  /**
   * 연결 상태 확인
   * @returns {boolean}
   */
  getConnectionStatus() {
    return this.isConnected;
  }
}

export default new SocketService();
