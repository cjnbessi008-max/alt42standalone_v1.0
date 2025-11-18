/**
 * Focus Mode LMS SDK
 * JavaScript SDK for integrating Focus Mode into LMS platforms
 */

export interface FocusModeSDKConfig {
  apiUrl: string;
  apiKey?: string;
  courseId: string;
  userId: string;
  autoStart?: boolean;
  onFocusStart?: (sessionId: string) => void;
  onFocusEnd?: (sessionId: string, duration: number, score: number) => void;
  onError?: (error: Error) => void;
}

export interface FocusSession {
  sessionId: string;
  userId: string;
  courseId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  avgBlinkRate?: number;
  focusScore?: number;
}

export class FocusModeLMSSDK {
  private config: FocusModeSDKConfig;
  private currentSession: FocusSession | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private iframe: HTMLIFrameElement | null = null;

  constructor(config: FocusModeSDKConfig) {
    this.config = {
      autoStart: false,
      ...config,
    };
  }

  /**
   * Initialize the Focus Mode SDK
   */
  async init(containerElement: HTMLElement): Promise<void> {
    try {
      // Create iframe for Focus Mode app
      this.iframe = document.createElement('iframe');
      this.iframe.src = `${this.config.apiUrl}/focus-learning?courseId=${this.config.courseId}&userId=${this.config.userId}`;
      this.iframe.style.width = '100%';
      this.iframe.style.height = '600px';
      this.iframe.style.border = 'none';
      this.iframe.allow = 'camera';

      containerElement.appendChild(this.iframe);

      // Set up message listener for iframe communication
      window.addEventListener('message', this.handleMessage);

      if (this.config.autoStart) {
        await this.start();
      }

      console.log('✅ Focus Mode SDK initialized');
    } catch (error) {
      console.error('Failed to initialize Focus Mode SDK:', error);
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
      throw error;
    }
  }

  /**
   * Handle messages from iframe
   */
  private handleMessage = (event: MessageEvent) => {
    // Verify origin
    if (!event.origin.startsWith(this.config.apiUrl)) {
      return;
    }

    const { type, data } = event.data;

    switch (type) {
      case 'focus-start':
        this.handleFocusStart(data);
        break;
      case 'focus-end':
        this.handleFocusEnd(data);
        break;
      case 'error':
        this.handleError(data);
        break;
    }
  };

  /**
   * Start a new focus session
   */
  async start(): Promise<string> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/focus-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({
          userId: this.config.userId,
          courseId: this.config.courseId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start session: ${response.statusText}`);
      }

      const data = await response.json();
      this.currentSession = {
        sessionId: data.sessionId,
        userId: data.userId,
        courseId: data.courseId,
        startTime: new Date(data.startTime),
      };

      // Notify iframe to start tracking
      this.postMessageToIframe('start-tracking', { sessionId: data.sessionId });

      console.log('✅ Focus session started:', data.sessionId);
      return data.sessionId;
    } catch (error) {
      console.error('Failed to start focus session:', error);
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
      throw error;
    }
  }

  /**
   * End current focus session
   */
  async end(): Promise<void> {
    if (!this.currentSession) {
      console.warn('No active session to end');
      return;
    }

    try {
      const response = await fetch(
        `${this.config.apiUrl}/api/focus-sessions/${this.currentSession.sessionId}/end`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
          },
          body: JSON.stringify({
            endTime: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to end session: ${response.statusText}`);
      }

      const data = await response.json();

      // Notify iframe to stop tracking
      this.postMessageToIframe('stop-tracking', {});

      if (this.config.onFocusEnd) {
        this.config.onFocusEnd(
          data.sessionId,
          data.duration,
          data.focusScore
        );
      }

      this.currentSession = null;
      console.log('✅ Focus session ended');
    } catch (error) {
      console.error('Failed to end focus session:', error);
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
      throw error;
    }
  }

  /**
   * Get user's focus history
   */
  async getUserHistory(limit: number = 10): Promise<FocusSession[]> {
    try {
      const response = await fetch(
        `${this.config.apiUrl}/api/focus-sessions/user/${this.config.userId}?limit=${limit}`,
        {
          headers: {
            ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.statusText}`);
      }

      const data = await response.json();
      return data.sessions;
    } catch (error) {
      console.error('Failed to fetch user history:', error);
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<any> {
    try {
      const response = await fetch(
        `${this.config.apiUrl}/api/focus-sessions/user/${this.config.userId}/stats`,
        {
          headers: {
            ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      const data = await response.json();
      return data.stats;
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
      throw error;
    }
  }

  /**
   * Post message to iframe
   */
  private postMessageToIframe(type: string, data: any): void {
    if (this.iframe && this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage({ type, data }, this.config.apiUrl);
    }
  }

  /**
   * Handle focus start event from iframe
   */
  private handleFocusStart(data: any): void {
    console.log('🎯 Focus mode activated');
    if (this.config.onFocusStart && this.currentSession) {
      this.config.onFocusStart(this.currentSession.sessionId);
    }
  }

  /**
   * Handle focus end event from iframe
   */
  private handleFocusEnd(data: any): void {
    console.log('👋 Focus mode deactivated');
  }

  /**
   * Handle error from iframe
   */
  private handleError(error: any): void {
    console.error('Error from Focus Mode:', error);
    if (this.config.onError) {
      this.config.onError(new Error(error.message || 'Unknown error'));
    }
  }

  /**
   * Cleanup and destroy SDK instance
   */
  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }

    window.removeEventListener('message', this.handleMessage);

    console.log('✅ Focus Mode SDK destroyed');
  }

  /**
   * Get current session
   */
  getCurrentSession(): FocusSession | null {
    return this.currentSession;
  }
}

// Export for browser usage
if (typeof window !== 'undefined') {
  (window as any).FocusModeLMSSDK = FocusModeLMSSDK;
}
