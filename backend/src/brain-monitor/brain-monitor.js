/**
 * Brain Overheating Monitor
 * 뇌 과열 감지 시스템
 *
 * 학습 활동 패턴 분석을 통한 인지 부하 추정
 */

const EventEmitter = require('events');

class BrainMonitor extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      // 임계값 설정
      thresholds: {
        sessionDuration: config.thresholds?.sessionDuration || 45 * 60, // 45분 (초)
        activityFrequency: config.thresholds?.activityFrequency || 30, // 30 activities/10min
        errorRate: config.thresholds?.errorRate || 0.5, // 50% 오답률
        responseTime: config.thresholds?.responseTime || 15, // 15초 이상 응답 시간
        cognitiveLoad: config.thresholds?.cognitiveLoad || 0.75 // 75% 인지 부하
      },

      // 모니터링 간격
      checkInterval: config.checkInterval || 60 * 1000, // 1분

      // 히스토리 유지 기간
      historyDuration: config.historyDuration || 30 * 60 * 1000, // 30분
    };

    // 사용자별 상태 저장
    this.userStates = new Map();

    // 모니터링 인터벌
    this.monitoringInterval = null;
  }

  /**
   * 모니터링 시작
   */
  start() {
    if (this.monitoringInterval) {
      return;
    }

    console.log('✓ 뇌 과열 모니터링 시작');

    this.monitoringInterval = setInterval(() => {
      this.checkAllUsers();
    }, this.config.checkInterval);
  }

  /**
   * 모니터링 중지
   */
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('✓ 뇌 과열 모니터링 중지');
    }
  }

  /**
   * 사용자 활동 기록
   */
  recordActivity(userId, activity) {
    if (!this.userStates.has(userId)) {
      this.userStates.set(userId, {
        userId,
        sessionStart: Date.now(),
        activities: [],
        errors: [],
        responseTimes: [],
        lastActivity: Date.now(),
        overheated: false,
        calmModeActive: false
      });
    }

    const userState = this.userStates.get(userId);
    const now = Date.now();

    // 활동 기록
    userState.activities.push({
      type: activity.type,
      timestamp: now,
      courseId: activity.courseId,
      activityId: activity.activityId
    });

    // 오답 기록
    if (activity.isError) {
      userState.errors.push({
        timestamp: now,
        activityId: activity.activityId
      });
    }

    // 응답 시간 기록
    if (activity.responseTime) {
      userState.responseTimes.push({
        timestamp: now,
        duration: activity.responseTime
      });
    }

    userState.lastActivity = now;

    // 오래된 데이터 정리
    this.cleanOldData(userState);

    // 즉시 체크
    this.checkUserState(userId);
  }

  /**
   * 오래된 데이터 정리
   */
  cleanOldData(userState) {
    const now = Date.now();
    const cutoff = now - this.config.historyDuration;

    userState.activities = userState.activities.filter(a => a.timestamp > cutoff);
    userState.errors = userState.errors.filter(e => e.timestamp > cutoff);
    userState.responseTimes = userState.responseTimes.filter(r => r.timestamp > cutoff);
  }

  /**
   * 모든 사용자 상태 체크
   */
  checkAllUsers() {
    for (const [userId, userState] of this.userStates.entries()) {
      this.checkUserState(userId);
    }
  }

  /**
   * 사용자 상태 체크
   */
  checkUserState(userId) {
    const userState = this.userStates.get(userId);
    if (!userState) return;

    const now = Date.now();
    const cognitiveLoad = this.calculateCognitiveLoad(userState, now);

    // 인지 부하 점수 저장
    userState.cognitiveLoad = cognitiveLoad;

    // 과열 상태 판단
    const shouldOverheat = cognitiveLoad >= this.config.thresholds.cognitiveLoad;

    if (shouldOverheat && !userState.overheated) {
      // 과열 시작
      userState.overheated = true;
      userState.overheatedAt = now;

      this.emit('overheating', {
        userId,
        cognitiveLoad,
        metrics: this.getMetrics(userState, now)
      });

      console.log(`⚠️  사용자 ${userId} 뇌 과열 감지 (인지 부하: ${(cognitiveLoad * 100).toFixed(1)}%)`);
    } else if (!shouldOverheat && userState.overheated) {
      // 과열 해제
      userState.overheated = false;

      this.emit('cooling', {
        userId,
        cognitiveLoad,
        duration: now - userState.overheatedAt
      });

      console.log(`✓ 사용자 ${userId} 뇌 과열 해제 (인지 부하: ${(cognitiveLoad * 100).toFixed(1)}%)`);
    }
  }

  /**
   * 인지 부하 계산 (0.0 ~ 1.0)
   */
  calculateCognitiveLoad(userState, now) {
    const metrics = this.getMetrics(userState, now);

    // 가중치 설정
    const weights = {
      sessionDuration: 0.25,
      activityFrequency: 0.20,
      errorRate: 0.30,
      responseTime: 0.25
    };

    // 각 메트릭을 0~1로 정규화
    const scores = {
      sessionDuration: Math.min(metrics.sessionDuration / this.config.thresholds.sessionDuration, 1.0),
      activityFrequency: Math.min(metrics.activityFrequency / this.config.thresholds.activityFrequency, 1.0),
      errorRate: Math.min(metrics.errorRate / this.config.thresholds.errorRate, 1.0),
      responseTime: Math.min(metrics.avgResponseTime / this.config.thresholds.responseTime, 1.0)
    };

    // 가중 평균 계산
    const cognitiveLoad =
      scores.sessionDuration * weights.sessionDuration +
      scores.activityFrequency * weights.activityFrequency +
      scores.errorRate * weights.errorRate +
      scores.responseTime * weights.responseTime;

    return Math.min(cognitiveLoad, 1.0);
  }

  /**
   * 메트릭 계산
   */
  getMetrics(userState, now) {
    // 세션 지속 시간 (초)
    const sessionDuration = (now - userState.sessionStart) / 1000;

    // 최근 10분간 활동 빈도
    const tenMinutesAgo = now - 10 * 60 * 1000;
    const recentActivities = userState.activities.filter(a => a.timestamp > tenMinutesAgo);
    const activityFrequency = recentActivities.length;

    // 최근 오답률
    const recentErrors = userState.errors.filter(e => e.timestamp > tenMinutesAgo);
    const errorRate = recentActivities.length > 0
      ? recentErrors.length / recentActivities.length
      : 0;

    // 평균 응답 시간 (초)
    const recentResponseTimes = userState.responseTimes.filter(r => r.timestamp > tenMinutesAgo);
    const avgResponseTime = recentResponseTimes.length > 0
      ? recentResponseTimes.reduce((sum, r) => sum + r.duration, 0) / recentResponseTimes.length
      : 0;

    return {
      sessionDuration,
      activityFrequency,
      errorRate,
      avgResponseTime,
      totalActivities: userState.activities.length,
      totalErrors: userState.errors.length
    };
  }

  /**
   * 사용자 상태 조회
   */
  getUserState(userId) {
    const userState = this.userStates.get(userId);
    if (!userState) {
      return null;
    }

    const now = Date.now();
    return {
      userId,
      overheated: userState.overheated,
      calmModeActive: userState.calmModeActive,
      cognitiveLoad: userState.cognitiveLoad || 0,
      metrics: this.getMetrics(userState, now),
      sessionStart: userState.sessionStart,
      lastActivity: userState.lastActivity
    };
  }

  /**
   * 안정 모드 활성화 설정
   */
  setCalmMode(userId, active) {
    const userState = this.userStates.get(userId);
    if (userState) {
      userState.calmModeActive = active;

      if (active) {
        console.log(`🔵 사용자 ${userId} 안정 모드 활성화`);
      } else {
        console.log(`⚪ 사용자 ${userId} 안정 모드 비활성화`);
      }
    }
  }

  /**
   * 세션 종료
   */
  endSession(userId) {
    if (this.userStates.has(userId)) {
      this.userStates.delete(userId);
      console.log(`✓ 사용자 ${userId} 세션 종료`);
    }
  }

  /**
   * 모든 세션 종료
   */
  clearAllSessions() {
    this.userStates.clear();
    console.log('✓ 모든 사용자 세션 종료');
  }
}

module.exports = BrainMonitor;
