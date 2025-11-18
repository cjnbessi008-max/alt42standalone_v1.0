/**
 * Mental Care Service
 * Handles API calls and WebSocket connections for mental care messaging
 */

import {
  MentalCareMessage,
  StudentProgress,
  AnalysisResponse,
  AttemptSubmission,
  WebSocketMessage,
} from '../types/mental-care.types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

class MentalCareService {
  private ws: WebSocket | null = null;
  private messageCallbacks: ((message: MentalCareMessage) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  /**
   * Submit a student attempt and receive real-time analysis
   */
  async submitAttempt(attempt: AttemptSubmission): Promise<AnalysisResponse> {
    const response = await fetch(`${API_BASE_URL}/api/attempts/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attempt),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit attempt: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get progress for a student-module combination
   */
  async getProgress(studentId: string, moduleId: string): Promise<StudentProgress> {
    const response = await fetch(
      `${API_BASE_URL}/api/progress/${studentId}/${moduleId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get progress: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get message history for a student
   */
  async getMessageHistory(
    studentId: string,
    limit: number = 20
  ): Promise<MentalCareMessage[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/messages/history/${studentId}?limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get message history: ${response.statusText}`);
    }

    const data = await response.json();
    return data.messages || [];
  }

  /**
   * Submit feedback on a mental care message
   */
  async submitMessageFeedback(
    messageId: string,
    studentId: string,
    reaction: 'helpful' | 'not_helpful' | 'neutral'
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/messages/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message_id: messageId,
        student_id: studentId,
        reaction,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit feedback: ${response.statusText}`);
    }
  }

  /**
   * Connect to WebSocket for real-time messages
   */
  connectWebSocket(studentId: string, onMessage: (message: MentalCareMessage) => void): void {
    // Store callback
    this.messageCallbacks.push(onMessage);

    // Close existing connection if any
    if (this.ws) {
      this.ws.close();
    }

    // Create new WebSocket connection
    this.ws = new WebSocket(`${WS_BASE_URL}/ws/${studentId}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (event) => {
      try {
        const wsMessage: WebSocketMessage = JSON.parse(event.data);

        if (wsMessage.type === 'mental_care_message' && wsMessage.data) {
          const message: MentalCareMessage = wsMessage.data;
          // Notify all callbacks
          this.messageCallbacks.forEach((callback) => callback(message));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect
      this.attemptReconnect(studentId);
    };
  }

  /**
   * Attempt to reconnect WebSocket with exponential backoff
   */
  private attemptReconnect(studentId: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        const callbacks = [...this.messageCallbacks];
        this.messageCallbacks = [];
        callbacks.forEach((callback) => this.connectWebSocket(studentId, callback));
      }, this.reconnectDelay);

      // Exponential backoff
      this.reconnectDelay *= 2;
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageCallbacks = [];
    this.reconnectAttempts = 0;
  }

  /**
   * Get system status (admin)
   */
  async getSystemStatus(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/admin/system-status`);

    if (!response.ok) {
      throw new Error(`Failed to get system status: ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const mentalCareService = new MentalCareService();
export default mentalCareService;
