/**
 * 집중 추적 이벤트 타입
 */
export type FocusEventType =
  | 'focus_lost'
  | 'focus_regained'
  | 'idle_detected'
  | 'break_started'
  | 'break_completed'
  | 'break_skipped';

/**
 * 집중 추적 이벤트
 */
export interface FocusTrackingEvent {
  eventType: FocusEventType;
  timestamp: number;
  studentId: string;
  moduleId: string;
  sessionId: string;
  metadata?: {
    idleTime?: number;
    breakDuration?: number;
    breakActivityType?: string;
    pageUrl?: string;
    completed?: boolean;
  };
}

/**
 * 집중 통계
 */
export interface FocusStatistics {
  studentId: string;
  moduleId: string;
  sessionId: string;
  totalFocusTime: number;
  totalIdleTime: number;
  focusLostCount: number;
  breaksCompleted: number;
  breaksSkipped: number;
  averageBreakDuration: number;
  lastActivityTimestamp: number;
}

/**
 * 집중 추적 서비스
 *
 * LMS와 연동하여 학생의 집중도를 추적하고 분석합니다.
 */
class FocusTrackingService {
  private apiBaseUrl: string;
  private currentSessionId: string | null = null;
  private eventQueue: FocusTrackingEvent[] = [];
  private flushInterval: number = 10000; // 10초마다 전송
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(apiBaseUrl: string = '/api') {
    this.apiBaseUrl = apiBaseUrl;
    this.startAutoFlush();
  }

  /**
   * 세션 시작
   */
  startSession(studentId: string, moduleId: string): string {
    this.currentSessionId = this.generateSessionId();

    const event: FocusTrackingEvent = {
      eventType: 'focus_regained',
      timestamp: Date.now(),
      studentId,
      moduleId,
      sessionId: this.currentSessionId,
      metadata: {
        pageUrl: window.location.href,
      },
    };

    this.trackEvent(event);
    return this.currentSessionId;
  }

  /**
   * 세션 종료
   */
  async endSession(): Promise<void> {
    await this.flush();
    this.currentSessionId = null;
  }

  /**
   * 이벤트 추적
   */
  trackEvent(event: FocusTrackingEvent): void {
    this.eventQueue.push(event);

    // 중요한 이벤트는 즉시 전송
    if (event.eventType === 'focus_lost' || event.eventType === 'break_completed') {
      this.flush();
    }
  }

  /**
   * 집중 이탈 추적
   */
  trackFocusLost(studentId: string, moduleId: string, idleTime?: number): void {
    if (!this.currentSessionId) {
      this.startSession(studentId, moduleId);
    }

    const event: FocusTrackingEvent = {
      eventType: 'focus_lost',
      timestamp: Date.now(),
      studentId,
      moduleId,
      sessionId: this.currentSessionId!,
      metadata: {
        idleTime,
        pageUrl: window.location.href,
      },
    };

    this.trackEvent(event);
  }

  /**
   * 집중 복귀 추적
   */
  trackFocusRegained(studentId: string, moduleId: string): void {
    if (!this.currentSessionId) {
      this.startSession(studentId, moduleId);
    }

    const event: FocusTrackingEvent = {
      eventType: 'focus_regained',
      timestamp: Date.now(),
      studentId,
      moduleId,
      sessionId: this.currentSessionId!,
      metadata: {
        pageUrl: window.location.href,
      },
    };

    this.trackEvent(event);
  }

  /**
   * 휴식 시작 추적
   */
  trackBreakStarted(
    studentId: string,
    moduleId: string,
    activityType: string
  ): void {
    if (!this.currentSessionId) {
      this.startSession(studentId, moduleId);
    }

    const event: FocusTrackingEvent = {
      eventType: 'break_started',
      timestamp: Date.now(),
      studentId,
      moduleId,
      sessionId: this.currentSessionId!,
      metadata: {
        breakActivityType: activityType,
      },
    };

    this.trackEvent(event);
  }

  /**
   * 휴식 완료 추적
   */
  trackBreakCompleted(
    studentId: string,
    moduleId: string,
    activityType: string,
    duration: number
  ): void {
    if (!this.currentSessionId) return;

    const event: FocusTrackingEvent = {
      eventType: 'break_completed',
      timestamp: Date.now(),
      studentId,
      moduleId,
      sessionId: this.currentSessionId,
      metadata: {
        breakActivityType: activityType,
        breakDuration: duration,
        completed: true,
      },
    };

    this.trackEvent(event);
  }

  /**
   * 휴식 건너뛰기 추적
   */
  trackBreakSkipped(
    studentId: string,
    moduleId: string,
    activityType: string,
    duration: number
  ): void {
    if (!this.currentSessionId) return;

    const event: FocusTrackingEvent = {
      eventType: 'break_skipped',
      timestamp: Date.now(),
      studentId,
      moduleId,
      sessionId: this.currentSessionId,
      metadata: {
        breakActivityType: activityType,
        breakDuration: duration,
        completed: false,
      },
    };

    this.trackEvent(event);
  }

  /**
   * 통계 조회
   */
  async getStatistics(
    studentId: string,
    moduleId: string
  ): Promise<FocusStatistics> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/focus-tracking/statistics?studentId=${studentId}&moduleId=${moduleId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching focus statistics:', error);
      throw error;
    }
  }

  /**
   * 이벤트 큐 전송
   */
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(`${this.apiBaseUrl}/focus-tracking/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToSend }),
      });

      if (!response.ok) {
        // 실패한 이벤트를 다시 큐에 추가
        this.eventQueue.unshift(...eventsToSend);
        console.error('Failed to send focus tracking events:', response.statusText);
      }
    } catch (error) {
      // 실패한 이벤트를 다시 큐에 추가
      this.eventQueue.unshift(...eventsToSend);
      console.error('Error sending focus tracking events:', error);
    }
  }

  /**
   * 자동 전송 시작
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // 페이지 언로드 시 전송
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Visibility 변경 시 전송
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush();
      }
    });
  }

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 서비스 종료
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}

// 싱글톤 인스턴스
export const focusTrackingService = new FocusTrackingService();

export default focusTrackingService;
