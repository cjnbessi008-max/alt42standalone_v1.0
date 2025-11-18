import { LMSConfig, LMSUser, LMSSession, LMSActivityLog } from '../types/lms';
import { BreathingSession } from '../types/breathing';

class LMSService {
  private config: LMSConfig;
  private session: LMSSession | null = null;

  constructor(config: LMSConfig) {
    this.config = config;
  }

  /**
   * LMS 설정 업데이트
   */
  updateConfig(config: Partial<LMSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * LMS 인증
   */
  async authenticate(userId: string, sessionToken: string): Promise<LMSSession> {
    if (!this.config.enableAuthentication) {
      // 인증이 비활성화된 경우 mock session 반환
      const mockSession: LMSSession = {
        userId,
        courseId: 'default',
        sessionToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
      };
      this.session = mockSession;
      return mockSession;
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
        },
        body: JSON.stringify({ userId, sessionToken }),
      });

      if (!response.ok) {
        throw new Error('인증 실패');
      }

      const session: LMSSession = await response.json();
      this.session = session;
      return session;
    } catch (error) {
      console.error('LMS 인증 에러:', error);
      throw error;
    }
  }

  /**
   * 사용자 정보 가져오기
   */
  async getUserInfo(userId: string): Promise<LMSUser> {
    if (!this.config.enableAuthentication) {
      // Mock 사용자 반환
      return {
        id: userId,
        name: '테스트 사용자',
        email: 'test@example.com',
        role: 'student',
      };
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/users/${userId}`, {
        headers: {
          ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
          ...(this.session && { 'Authorization': `Bearer ${this.session.sessionToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error('사용자 정보 조회 실패');
      }

      return await response.json();
    } catch (error) {
      console.error('사용자 정보 조회 에러:', error);
      throw error;
    }
  }

  /**
   * 호흡 세션 로그 전송
   */
  async logBreathingSession(session: BreathingSession): Promise<void> {
    if (!this.config.enableTracking) {
      console.log('트래킹 비활성화됨, 세션 로그:', session);
      return;
    }

    if (!this.session) {
      console.warn('LMS 세션이 없습니다. 로그를 전송하지 않습니다.');
      return;
    }

    const activityLog: LMSActivityLog = {
      userId: this.session.userId,
      courseId: this.session.courseId,
      activityType: 'breathing_session',
      data: {
        pattern: session.pattern.name,
        duration: session.endTime
          ? (session.endTime.getTime() - session.startTime.getTime()) / 1000
          : 0,
        cycles: session.totalCycles,
        completed: session.completed,
      },
      timestamp: new Date(),
    };

    try {
      const response = await fetch(`${this.config.apiUrl}/activities/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
          ...(this.session && { 'Authorization': `Bearer ${this.session.sessionToken}` }),
        },
        body: JSON.stringify(activityLog),
      });

      if (!response.ok) {
        throw new Error('활동 로그 전송 실패');
      }

      console.log('호흡 세션 로그 전송 완료:', activityLog);
    } catch (error) {
      console.error('활동 로그 전송 에러:', error);
      // 에러가 발생해도 사용자 경험을 방해하지 않도록 조용히 실패
    }
  }

  /**
   * 현재 세션 정보 가져오기
   */
  getSession(): LMSSession | null {
    return this.session;
  }

  /**
   * 세션 만료 확인
   */
  isSessionValid(): boolean {
    if (!this.session) return false;
    return new Date() < this.session.expiresAt;
  }

  /**
   * 로그아웃
   */
  logout(): void {
    this.session = null;
  }
}

// 기본 LMS 서비스 인스턴스 생성 (개발 환경)
export const lmsService = new LMSService({
  apiUrl: import.meta.env.VITE_LMS_API_URL || 'http://localhost:4000/api',
  apiKey: import.meta.env.VITE_LMS_API_KEY,
  enableTracking: import.meta.env.VITE_LMS_ENABLE_TRACKING !== 'false',
  enableAuthentication: import.meta.env.VITE_LMS_ENABLE_AUTH !== 'false',
});

export default LMSService;
