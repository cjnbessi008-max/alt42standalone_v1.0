import { WebSocketMessage, FocusData } from '@/types';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private sessionId: string | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  connect(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.sessionId = sessionId;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/${sessionId}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket 연결됨');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (err) {
            console.error('WebSocket 메시지 파싱 오류:', err);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket 오류:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket 연결 종료');
          this.attemptReconnect();
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  private handleMessage(message: WebSocketMessage) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  on(messageType: string, handler: (data: any) => void) {
    this.messageHandlers.set(messageType, handler);
  }

  off(messageType: string) {
    this.messageHandlers.delete(messageType);
  }

  sendFocusUpdate(focusData: FocusData) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'focus-update',
        data: focusData,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  sendSessionStart(sessionId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'session-start',
        sessionId,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  sendSessionEnd(sessionId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'session-end',
        sessionId,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.sessionId) {
      this.reconnectAttempts++;
      console.log(`재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      setTimeout(() => {
        if (this.sessionId) {
          this.connect(this.sessionId).catch((err) => {
            console.error('재연결 실패:', err);
          });
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.sessionId = null;
    this.messageHandlers.clear();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
