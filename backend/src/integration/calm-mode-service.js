/**
 * Calm Mode Integration Service
 * Moodle LMS와 뇌 모니터링, 안정 모드를 통합하는 서비스
 */

const MoodleConnector = require('../moodle/moodle-connector');
const BrainMonitor = require('../brain-monitor/brain-monitor');
const EventEmitter = require('events');

class CalmModeService extends EventEmitter {
  constructor(config) {
    super();

    // Moodle 연결
    this.moodle = new MoodleConnector(config.moodle);

    // 뇌 모니터링
    this.brainMonitor = new BrainMonitor(config.brainMonitor);

    // 웹소켓 연결 저장소
    this.userConnections = new Map();

    // 활동 동기화 간격 (밀리초)
    this.syncInterval = config.syncInterval || 30 * 1000; // 30초

    // 동기화 타이머
    this.syncTimer = null;

    this.setupEventHandlers();
  }

  /**
   * 이벤트 핸들러 설정
   */
  setupEventHandlers() {
    // 뇌 과열 감지 시
    this.brainMonitor.on('overheating', async (data) => {
      await this.handleOverheating(data);
    });

    // 뇌 냉각 시
    this.brainMonitor.on('cooling', async (data) => {
      await this.handleCooling(data);
    });
  }

  /**
   * 서비스 초기화
   */
  async initialize() {
    try {
      // Moodle MySQL 연결 초기화
      await this.moodle.initializePool();

      // 뇌 모니터링 시작
      this.brainMonitor.start();

      // Moodle 활동 동기화 시작
      this.startActivitySync();

      console.log('✓ Calm Mode Service 초기화 완료');
      return true;
    } catch (error) {
      console.error('✗ Calm Mode Service 초기화 실패:', error.message);
      throw error;
    }
  }

  /**
   * 사용자 세션 시작
   */
  async startUserSession(userId, websocket) {
    try {
      // 웹소켓 연결 저장
      this.userConnections.set(userId, websocket);

      // Moodle에서 사용자 정보 조회
      const userInfo = await this.moodle.getUserInfo(userId);
      if (!userInfo) {
        throw new Error(`User ${userId} not found in Moodle`);
      }

      // Moodle에서 사용자의 안정 모드 설정 불러오기
      const calmModeEnabled = await this.moodle.getUserMetadata(userId, 'calm_mode_enabled');

      console.log(`✓ 사용자 ${userId} (${userInfo.firstname} ${userInfo.lastname}) 세션 시작`);

      // 초기 상태 전송
      this.sendToUser(userId, {
        type: 'session_started',
        user: {
          id: userInfo.id,
          username: userInfo.username,
          firstname: userInfo.firstname,
          lastname: userInfo.lastname
        },
        calmModeEnabled: calmModeEnabled === 'true'
      });

      return userInfo;
    } catch (error) {
      console.error(`✗ 사용자 ${userId} 세션 시작 실패:`, error.message);
      throw error;
    }
  }

  /**
   * 사용자 세션 종료
   */
  async endUserSession(userId) {
    try {
      // 웹소켓 연결 제거
      this.userConnections.delete(userId);

      // 뇌 모니터링 세션 종료
      this.brainMonitor.endSession(userId);

      console.log(`✓ 사용자 ${userId} 세션 종료`);
    } catch (error) {
      console.error(`✗ 사용자 ${userId} 세션 종료 실패:`, error.message);
    }
  }

  /**
   * 사용자 활동 기록
   */
  async recordActivity(userId, activity) {
    try {
      // 뇌 모니터링에 활동 기록
      this.brainMonitor.recordActivity(userId, activity);

      // 현재 뇌 상태 조회
      const brainState = this.brainMonitor.getUserState(userId);

      // 사용자에게 상태 전송
      if (brainState) {
        this.sendToUser(userId, {
          type: 'brain_status_update',
          status: brainState
        });
      }

      return brainState;
    } catch (error) {
      console.error(`✗ 사용자 ${userId} 활동 기록 실패:`, error.message);
      throw error;
    }
  }

  /**
   * 과열 처리
   */
  async handleOverheating(data) {
    const { userId, cognitiveLoad, metrics } = data;

    try {
      console.log(`⚠️  사용자 ${userId} 뇌 과열 처리`);

      // Moodle에 과열 이벤트 기록
      await this.moodle.setUserMetadata(userId, 'last_overheating', Date.now().toString());
      await this.moodle.setUserMetadata(userId, 'cognitive_load', cognitiveLoad.toFixed(2));

      // 안정 모드 활성화
      this.brainMonitor.setCalmMode(userId, true);

      // 사용자에게 알림 전송
      this.sendToUser(userId, {
        type: 'calm_mode_activate',
        reason: 'auto',
        cognitiveLoad,
        metrics
      });

      // 이벤트 발생
      this.emit('user_overheating', { userId, cognitiveLoad, metrics });
    } catch (error) {
      console.error(`✗ 과열 처리 실패:`, error.message);
    }
  }

  /**
   * 냉각 처리
   */
  async handleCooling(data) {
    const { userId, cognitiveLoad, duration } = data;

    try {
      console.log(`✓ 사용자 ${userId} 뇌 냉각 처리`);

      // Moodle에 냉각 이벤트 기록
      await this.moodle.setUserMetadata(userId, 'last_cooling', Date.now().toString());
      await this.moodle.setUserMetadata(userId, 'overheating_duration', duration.toString());

      // 안정 모드 비활성화 (인지 부하가 충분히 낮은 경우)
      if (cognitiveLoad < 0.5) {
        this.brainMonitor.setCalmMode(userId, false);

        this.sendToUser(userId, {
          type: 'calm_mode_deactivate',
          reason: 'auto',
          cognitiveLoad
        });
      }

      // 이벤트 발생
      this.emit('user_cooling', { userId, cognitiveLoad, duration });
    } catch (error) {
      console.error(`✗ 냉각 처리 실패:`, error.message);
    }
  }

  /**
   * 수동으로 안정 모드 토글
   */
  async toggleCalmMode(userId, enabled) {
    try {
      // Moodle에 설정 저장
      await this.moodle.setUserMetadata(userId, 'calm_mode_enabled', enabled.toString());

      // 뇌 모니터에 설정
      this.brainMonitor.setCalmMode(userId, enabled);

      console.log(`${enabled ? '🔵' : '⚪'} 사용자 ${userId} 안정 모드 ${enabled ? '활성화' : '비활성화'} (수동)`);

      // 사용자에게 알림 전송
      this.sendToUser(userId, {
        type: enabled ? 'calm_mode_activate' : 'calm_mode_deactivate',
        reason: 'manual'
      });

      return true;
    } catch (error) {
      console.error(`✗ 안정 모드 토글 실패:`, error.message);
      throw error;
    }
  }

  /**
   * Moodle 활동 로그 동기화 시작
   */
  startActivitySync() {
    if (this.syncTimer) {
      return;
    }

    console.log('✓ Moodle 활동 동기화 시작');

    this.syncTimer = setInterval(async () => {
      await this.syncMoodleActivities();
    }, this.syncInterval);
  }

  /**
   * Moodle 활동 로그 동기화
   */
  async syncMoodleActivities() {
    try {
      // 연결된 모든 사용자에 대해
      for (const [userId] of this.userConnections) {
        // 최근 활동 로그 조회
        const now = Math.floor(Date.now() / 1000);
        const startTime = now - (this.syncInterval / 1000);

        const activities = await this.moodle.getUserActivityLog(userId, 50);

        // 동기화 간격 내의 활동만 처리
        const recentActivities = activities.filter(
          (activity) => activity.timecreated >= startTime
        );

        // 각 활동을 뇌 모니터에 기록
        for (const activity of recentActivities) {
          // 활동을 뇌 모니터 형식으로 변환
          const brainActivity = {
            type: activity.action,
            courseId: activity.courseid,
            activityId: activity.objectid,
            timestamp: activity.timecreated * 1000,
            // 오답 여부는 Moodle 로그에서 판단
            isError: activity.action === 'failed' || activity.target === 'attempt_failed'
          };

          this.brainMonitor.recordActivity(userId, brainActivity);
        }
      }
    } catch (error) {
      console.error('✗ Moodle 활동 동기화 실패:', error.message);
    }
  }

  /**
   * 활동 동기화 중지
   */
  stopActivitySync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('✓ Moodle 활동 동기화 중지');
    }
  }

  /**
   * 사용자에게 메시지 전송 (웹소켓)
   */
  sendToUser(userId, message) {
    const connection = this.userConnections.get(userId);
    if (connection && connection.readyState === 1) { // WebSocket.OPEN
      connection.send(JSON.stringify(message));
    }
  }

  /**
   * 사용자 상태 조회
   */
  async getUserStatus(userId) {
    try {
      // Moodle에서 사용자 정보 조회
      const userInfo = await this.moodle.getUserInfo(userId);
      if (!userInfo) {
        return null;
      }

      // 뇌 상태 조회
      const brainState = this.brainMonitor.getUserState(userId);

      // Moodle에서 안정 모드 설정 조회
      const calmModeEnabled = await this.moodle.getUserMetadata(userId, 'calm_mode_enabled');

      // 최근 코스 조회
      const courses = await this.moodle.getUserCourses(userId);

      return {
        user: {
          id: userInfo.id,
          username: userInfo.username,
          firstname: userInfo.firstname,
          lastname: userInfo.lastname,
          email: userInfo.email,
          lastaccess: userInfo.lastaccess
        },
        brainState: brainState || {
          overheated: false,
          cognitiveLoad: 0,
          calmModeActive: calmModeEnabled === 'true'
        },
        courses: courses.map(c => ({
          id: c.id,
          fullname: c.fullname,
          shortname: c.shortname
        }))
      };
    } catch (error) {
      console.error(`✗ 사용자 ${userId} 상태 조회 실패:`, error.message);
      throw error;
    }
  }

  /**
   * 헬스 체크
   */
  async healthCheck() {
    try {
      // Moodle 연결 확인
      const moodleHealth = await this.moodle.healthCheck();

      // 뇌 모니터링 상태
      const brainMonitorActive = this.brainMonitor.monitoringInterval !== null;

      // 활동 동기화 상태
      const syncActive = this.syncTimer !== null;

      return {
        status: 'healthy',
        moodle: moodleHealth,
        brainMonitor: {
          active: brainMonitorActive,
          activeSessions: this.brainMonitor.userStates.size
        },
        activitySync: {
          active: syncActive,
          connectedUsers: this.userConnections.size
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * 서비스 종료
   */
  async shutdown() {
    try {
      console.log('🔄 Calm Mode Service 종료 중...');

      // 활동 동기화 중지
      this.stopActivitySync();

      // 뇌 모니터링 중지
      this.brainMonitor.stop();

      // 모든 세션 종료
      this.brainMonitor.clearAllSessions();

      // 모든 웹소켓 연결 종료
      for (const [userId, connection] of this.userConnections) {
        if (connection.readyState === 1) {
          connection.close();
        }
      }
      this.userConnections.clear();

      // Moodle 연결 종료
      await this.moodle.close();

      console.log('✓ Calm Mode Service 종료 완료');
    } catch (error) {
      console.error('✗ Calm Mode Service 종료 실패:', error.message);
      throw error;
    }
  }
}

module.exports = CalmModeService;
