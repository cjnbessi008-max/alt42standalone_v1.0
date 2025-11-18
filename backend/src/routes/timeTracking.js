import express from 'express';
import { body, param, validationResult } from 'express-validator';
import * as TimeTracking from '../models/timeTracking.js';
import * as Student from '../models/student.js';
import * as Problem from '../models/problem.js';

const router = express.Router();

/**
 * Validation middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * POST /api/time-tracking/start
 * 문제 시도 시작
 */
router.post(
  '/start',
  [
    body('student_id').notEmpty().withMessage('Student ID is required'),
    body('problem_id').notEmpty().withMessage('Problem ID is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { student_id, problem_id } = req.body;

      // Check if there's already an active attempt
      const activeAttempt = await TimeTracking.getActiveAttempt(student_id, problem_id);
      if (activeAttempt) {
        return res.json({
          success: true,
          data: activeAttempt,
          message: 'Active attempt already exists'
        });
      }

      const attempt = await TimeTracking.startProblemAttempt(student_id, problem_id);

      res.status(201).json({
        success: true,
        data: attempt,
        message: 'Problem attempt started successfully'
      });
    } catch (error) {
      console.error('Error starting problem attempt:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * POST /api/time-tracking/event
 * 시간 추적 이벤트 기록 (focus, blur, interaction 등)
 */
router.post(
  '/event',
  [
    body('attempt_id').isUUID().withMessage('Valid attempt ID is required'),
    body('event_type').isIn(['focus', 'blur', 'interaction', 'pause', 'resume', 'hint_request'])
      .withMessage('Invalid event type'),
  ],
  validate,
  async (req, res) => {
    try {
      const { attempt_id, event_type, event_data } = req.body;

      const event = await TimeTracking.recordTimeEvent(attempt_id, event_type, event_data);

      res.json({
        success: true,
        data: event,
        message: 'Event recorded successfully'
      });
    } catch (error) {
      console.error('Error recording event:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * POST /api/time-tracking/complete
 * 문제 시도 완료
 */
router.post(
  '/complete',
  [
    body('attempt_id').isUUID().withMessage('Valid attempt ID is required'),
    body('is_correct').isBoolean().withMessage('is_correct must be a boolean'),
  ],
  validate,
  async (req, res) => {
    try {
      const { attempt_id, is_correct, answer_data } = req.body;

      const attempt = await TimeTracking.completeProblemAttempt(attempt_id, is_correct, answer_data);

      res.json({
        success: true,
        data: attempt,
        message: 'Problem attempt completed successfully'
      });
    } catch (error) {
      console.error('Error completing problem attempt:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * GET /api/time-tracking/attempts/:student_id
 * 학생의 시도 기록 조회
 */
router.get(
  '/attempts/:student_id',
  [
    param('student_id').notEmpty().withMessage('Student ID is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { student_id } = req.params;
      const { problem_id } = req.query;

      const attempts = await TimeTracking.getStudentAttempts(student_id, problem_id);

      res.json({
        success: true,
        data: attempts
      });
    } catch (error) {
      console.error('Error fetching attempts:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * GET /api/time-tracking/statistics/:problem_id
 * 문제별 통계 조회
 */
router.get(
  '/statistics/:problem_id',
  [
    param('problem_id').notEmpty().withMessage('Problem ID is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { problem_id } = req.params;

      const statistics = await TimeTracking.getProblemStatistics(problem_id);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * GET /api/time-tracking/active/:student_id/:problem_id
 * 활성 시도 조회
 */
router.get(
  '/active/:student_id/:problem_id',
  [
    param('student_id').notEmpty().withMessage('Student ID is required'),
    param('problem_id').notEmpty().withMessage('Problem ID is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { student_id, problem_id } = req.params;

      const attempt = await TimeTracking.getActiveAttempt(student_id, problem_id);

      res.json({
        success: true,
        data: attempt || null
      });
    } catch (error) {
      console.error('Error fetching active attempt:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

export default router;
