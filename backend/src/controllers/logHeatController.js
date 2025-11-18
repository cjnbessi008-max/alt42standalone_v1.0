const logHeatService = require('../services/logHeatService');
const moodleService = require('../services/moodleService');
const { LogEntry } = require('../models');

/**
 * Log Heat API 컨트롤러
 */
class LogHeatController {
  /**
   * 히트 데이터 계산 및 조회
   * GET /api/heat
   */
  async getHeat(req, res) {
    try {
      const {
        timeWindow = '1h',
        userId,
        courseId,
        calculate = 'false'
      } = req.query;

      let heatData;

      if (calculate === 'true') {
        // 실시간 계산
        const filters = {};
        if (userId) filters.userId = parseInt(userId);
        if (courseId) filters.courseId = parseInt(courseId);

        heatData = await logHeatService.calculateLogHeat(timeWindow, filters);
      } else {
        // 저장된 데이터 조회
        const options = { timeWindow };
        if (userId) options.userId = parseInt(userId);
        if (courseId) options.courseId = parseInt(courseId);

        const data = await logHeatService.getLogHeatData(options);
        heatData = data[0] || null;
      }

      res.json({
        success: true,
        data: heatData
      });
    } catch (error) {
      console.error('히트 데이터 조회 실패:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 모든 시간 윈도우 히트 데이터
   * GET /api/heat/all
   */
  async getAllTimeWindows(req, res) {
    try {
      const { userId, courseId } = req.query;

      const filters = {};
      if (userId) filters.userId = parseInt(userId);
      if (courseId) filters.courseId = parseInt(courseId);

      const heatData = await logHeatService.calculateAllTimeWindows(filters);

      res.json({
        success: true,
        data: heatData
      });
    } catch (error) {
      console.error('전체 히트 데이터 조회 실패:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 히트맵 데이터 (시간별)
   * GET /api/heat/heatmap
   */
  async getHeatmap(req, res) {
    try {
      const {
        hours = 24,
        userId,
        courseId
      } = req.query;

      const filters = {};
      if (userId) filters.userId = parseInt(userId);
      if (courseId) filters.courseId = parseInt(courseId);

      const heatmapData = await logHeatService.generateHeatmap(
        parseInt(hours),
        filters
      );

      res.json({
        success: true,
        data: heatmapData
      });
    } catch (error) {
      console.error('히트맵 데이터 생성 실패:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 사용자별 히트 랭킹
   * GET /api/heat/ranking
   */
  async getRanking(req, res) {
    try {
      const {
        limit = 10,
        timeWindow = '24h'
      } = req.query;

      const ranking = await logHeatService.getUserHeatRanking(
        parseInt(limit),
        timeWindow
      );

      res.json({
        success: true,
        data: ranking
      });
    } catch (error) {
      console.error('랭킹 조회 실패:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 로그 데이터 통계
   * GET /api/logs/stats
   */
  async getLogStats(req, res) {
    try {
      const { userId, courseId } = req.query;

      const filters = {};
      if (userId) filters.userId = parseInt(userId);
      if (courseId) filters.courseId = parseInt(courseId);

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 86400 * 1000);

      const stats = await logHeatService.getEventStatistics(
        oneDayAgo,
        now,
        filters
      );

      const totalCount = await logHeatService.getLogCount(
        oneDayAgo,
        now,
        filters
      );

      res.json({
        success: true,
        data: {
          totalLogs: totalCount,
          period: '24h',
          eventStats: stats
        }
      });
    } catch (error) {
      console.error('로그 통계 조회 실패:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Moodle에서 로그 동기화
   * POST /api/sync
   */
  async syncFromMoodle(req, res) {
    try {
      const {
        timefrom,
        timeto,
        userId,
        courseId
      } = req.body;

      // Moodle에서 로그 가져오기
      const logs = await moodleService.getLogs({
        timefrom,
        timeto,
        userid: userId,
        courseid: courseId
      });

      // DB에 저장
      let savedCount = 0;
      for (const log of logs) {
        try {
          await LogEntry.upsert({
            moodleLogId: log.id,
            userId: log.userid,
            courseId: log.courseid,
            eventName: log.eventname,
            action: log.action,
            target: log.target,
            objectId: log.objectid,
            timestamp: new Date(log.timecreated * 1000),
            ipAddress: log.ip,
            rawData: log
          });
          savedCount++;
        } catch (err) {
          console.error(`로그 ${log.id} 저장 실패:`, err.message);
        }
      }

      res.json({
        success: true,
        data: {
          fetched: logs.length,
          saved: savedCount
        }
      });
    } catch (error) {
      console.error('Moodle 동기화 실패:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Moodle 연결 테스트
   * GET /api/moodle/test
   */
  async testMoodleConnection(req, res) {
    try {
      const isConnected = await moodleService.testConnection();
      const info = await moodleService.getSiteInfo();

      res.json({
        success: isConnected,
        data: info
      });
    } catch (error) {
      console.error('Moodle 연결 테스트 실패:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new LogHeatController();
