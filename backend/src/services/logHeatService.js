const { LogEntry, LogHeat } = require('../models');
const { Op } = require('sequelize');
const {
  changeRateToColor,
  calculateHeatScore,
  getHeatLevel
} = require('../utils/colorTemperature');

/**
 * Log Heat 계산 및 분석 서비스
 */
class LogHeatService {
  /**
   * 시간 윈도우 설정 (초 단위)
   */
  static TIME_WINDOWS = {
    '1h': 3600,
    '6h': 21600,
    '24h': 86400,
    '7d': 604800,
    '30d': 2592000
  };

  /**
   * 특정 시간 범위의 로그 개수 조회
   * @param {Date} startTime - 시작 시각
   * @param {Date} endTime - 종료 시각
   * @param {Object} filters - 필터 (userId, courseId 등)
   * @returns {Promise<number>} 로그 개수
   */
  async getLogCount(startTime, endTime, filters = {}) {
    const where = {
      timestamp: {
        [Op.gte]: startTime,
        [Op.lt]: endTime
      }
    };

    if (filters.userId) where.userId = filters.userId;
    if (filters.courseId) where.courseId = filters.courseId;

    const count = await LogEntry.count({ where });
    return count;
  }

  /**
   * 변화율 계산
   * @param {number} currentCount - 현재 윈도우 로그 개수
   * @param {number} previousCount - 이전 윈도우 로그 개수
   * @returns {number} 변화율 (0-100)
   */
  calculateChangeRate(currentCount, previousCount) {
    if (previousCount === 0) {
      // 이전 데이터가 없으면 현재 개수를 기준으로 정규화
      return Math.min(100, currentCount * 10);
    }

    // 변화율 = ((현재 - 이전) / 이전) * 100
    const changeRate = ((currentCount - previousCount) / previousCount) * 100;

    // 0-100 범위로 정규화 (음수는 0으로, 100 이상은 100으로)
    return Math.max(0, Math.min(100, changeRate + 50));
  }

  /**
   * 로그 히트 계산 및 저장
   * @param {string} timeWindow - 시간 윈도우 ('1h', '6h', '24h', '7d', '30d')
   * @param {Object} filters - 필터 (userId, courseId 등)
   * @returns {Promise<Object>} 계산된 히트 데이터
   */
  async calculateLogHeat(timeWindow = '1h', filters = {}) {
    const windowSeconds = LogHeatService.TIME_WINDOWS[timeWindow];
    if (!windowSeconds) {
      throw new Error(`Invalid time window: ${timeWindow}`);
    }

    // 시간 범위 설정
    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - windowSeconds * 1000);

    const previousWindowEnd = new Date(windowStart);
    const previousWindowStart = new Date(
      previousWindowEnd.getTime() - windowSeconds * 1000
    );

    // 현재 윈도우와 이전 윈도우의 로그 개수 조회
    const [currentCount, previousCount] = await Promise.all([
      this.getLogCount(windowStart, windowEnd, filters),
      this.getLogCount(previousWindowStart, previousWindowEnd, filters)
    ]);

    // 변화율 계산
    const changeRate = this.calculateChangeRate(currentCount, previousCount);

    // 히트 스코어 계산
    const heatScore = calculateHeatScore(currentCount, changeRate);

    // 색 온도 계산
    const colorTemperature = changeRateToColor(changeRate);

    // 이벤트별 통계 (메타데이터)
    const eventStats = await this.getEventStatistics(
      windowStart,
      windowEnd,
      filters
    );

    // 결과 저장
    const heatData = {
      userId: filters.userId || null,
      courseId: filters.courseId || null,
      timeWindow,
      windowStart,
      windowEnd,
      logCount: currentCount,
      changeRate,
      heatScore,
      colorTemperature,
      metadata: {
        previousCount,
        eventStats,
        heatLevel: getHeatLevel(heatScore)
      }
    };

    // DB에 저장 (중복 방지: upsert)
    await LogHeat.upsert(heatData);

    return heatData;
  }

  /**
   * 이벤트별 통계 조회
   * @param {Date} startTime - 시작 시각
   * @param {Date} endTime - 종료 시각
   * @param {Object} filters - 필터
   * @returns {Promise<Object>} 이벤트별 카운트
   */
  async getEventStatistics(startTime, endTime, filters = {}) {
    const where = {
      timestamp: {
        [Op.gte]: startTime,
        [Op.lt]: endTime
      }
    };

    if (filters.userId) where.userId = filters.userId;
    if (filters.courseId) where.courseId = filters.courseId;

    const stats = await LogEntry.findAll({
      attributes: [
        'eventName',
        [LogEntry.sequelize.fn('COUNT', '*'), 'count']
      ],
      where,
      group: ['eventName'],
      order: [[LogEntry.sequelize.fn('COUNT', '*'), 'DESC']],
      limit: 10,
      raw: true
    });

    // { eventName: count } 형태로 변환
    const eventStats = {};
    stats.forEach(stat => {
      eventStats[stat.eventName] = parseInt(stat.count);
    });

    return eventStats;
  }

  /**
   * 여러 시간 윈도우의 히트 데이터 한번에 계산
   * @param {Object} filters - 필터
   * @returns {Promise<Array>} 히트 데이터 배열
   */
  async calculateAllTimeWindows(filters = {}) {
    const windows = Object.keys(LogHeatService.TIME_WINDOWS);
    const results = await Promise.all(
      windows.map(window => this.calculateLogHeat(window, filters))
    );

    return results;
  }

  /**
   * 저장된 히트 데이터 조회
   * @param {Object} options - 조회 옵션
   * @returns {Promise<Array>} 히트 데이터
   */
  async getLogHeatData(options = {}) {
    const {
      userId,
      courseId,
      timeWindow,
      limit = 100,
      startDate,
      endDate
    } = options;

    const where = {};

    if (userId) where.userId = userId;
    if (courseId) where.courseId = courseId;
    if (timeWindow) where.timeWindow = timeWindow;

    if (startDate || endDate) {
      where.windowStart = {};
      if (startDate) where.windowStart[Op.gte] = new Date(startDate);
      if (endDate) where.windowStart[Op.lte] = new Date(endDate);
    }

    const heatData = await LogHeat.findAll({
      where,
      order: [['windowStart', 'DESC']],
      limit,
      raw: true
    });

    return heatData;
  }

  /**
   * 실시간 히트맵 데이터 생성 (시간별)
   * @param {number} hours - 과거 몇 시간
   * @param {Object} filters - 필터
   * @returns {Promise<Array>} 시간별 히트 데이터
   */
  async generateHeatmap(hours = 24, filters = {}) {
    const heatmapData = [];
    const now = new Date();

    for (let i = 0; i < hours; i++) {
      const windowEnd = new Date(now.getTime() - i * 3600 * 1000);
      const windowStart = new Date(windowEnd.getTime() - 3600 * 1000);

      const previousWindowEnd = new Date(windowStart);
      const previousWindowStart = new Date(
        previousWindowEnd.getTime() - 3600 * 1000
      );

      const [currentCount, previousCount] = await Promise.all([
        this.getLogCount(windowStart, windowEnd, filters),
        this.getLogCount(previousWindowStart, previousWindowEnd, filters)
      ]);

      const changeRate = this.calculateChangeRate(currentCount, previousCount);
      const heatScore = calculateHeatScore(currentCount, changeRate);
      const colorTemperature = changeRateToColor(changeRate);

      heatmapData.push({
        hour: windowStart.toISOString(),
        logCount: currentCount,
        changeRate,
        heatScore,
        colorTemperature,
        heatLevel: getHeatLevel(heatScore)
      });
    }

    return heatmapData.reverse();
  }

  /**
   * 사용자별 히트 랭킹
   * @param {number} limit - 상위 N명
   * @param {string} timeWindow - 시간 윈도우
   * @returns {Promise<Array>} 사용자별 히트 데이터
   */
  async getUserHeatRanking(limit = 10, timeWindow = '24h') {
    const ranking = await LogHeat.findAll({
      where: {
        timeWindow,
        userId: { [Op.ne]: null }
      },
      order: [['heatScore', 'DESC']],
      limit,
      raw: true
    });

    return ranking;
  }
}

module.exports = new LogHeatService();
