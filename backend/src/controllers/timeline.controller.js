const timelineService = require('../services/timeline.service');
const { validationResult } = require('express-validator');

class TimelineController {
  // 새 타임라인 시작
  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await timelineService.startTimeline(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  // 타임라인 조회 (단계 포함)
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await timelineService.getTimelineWithSteps(id);
      res.json(result);
    } catch (error) {
      if (error.message === 'Timeline not found') {
        return res.status(404).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  // 학생별 타임라인 목록
  async getByStudentId(req, res, next) {
    try {
      const { studentId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await timelineService.getStudentTimelines(
        studentId,
        page,
        limit
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // 풀이 단계 추가
  async addStep(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const result = await timelineService.addStep(id, req.body);
      res.status(201).json(result);
    } catch (error) {
      if (error.message === 'Timeline not found') {
        return res.status(404).json({ error: { message: error.message } });
      }
      if (error.message === 'Timeline already completed') {
        return res.status(400).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  // 타임라인 완료
  async complete(req, res, next) {
    try {
      const { id } = req.params;
      const { final_answer, is_correct } = req.body;

      const result = await timelineService.completeTimeline(
        id,
        final_answer,
        is_correct
      );
      res.json(result);
    } catch (error) {
      if (error.message === 'Timeline not found') {
        return res.status(404).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  // 학생 통계 조회
  async getStudentStats(req, res, next) {
    try {
      const { studentId } = req.params;
      const result = await timelineService.getStudentStats(studentId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TimelineController();
