const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const timelineController = require('../controllers/timeline.controller');

// Validation rules
const createTimelineValidation = [
  body('student_id').notEmpty().withMessage('Student ID is required'),
  body('equation').notEmpty().withMessage('Equation is required'),
  body('student_name').optional().isString(),
  body('module_id').optional().isString(),
  body('problem_id').optional().isString(),
  body('difficulty_level').optional().isIn(['easy', 'medium', 'hard'])
];

const addStepValidation = [
  body('action_type').notEmpty().withMessage('Action type is required'),
  body('from_expression').notEmpty().withMessage('From expression is required'),
  body('to_expression').notEmpty().withMessage('To expression is required'),
  body('rule_applied').optional().isString(),
  body('rule_category').optional().isString(),
  body('explanation').optional().isString(),
  body('is_correct').optional().isBoolean(),
  body('hint_used').optional().isBoolean(),
  body('duration_ms').optional().isInt(),
  body('user_input').optional().isString()
];

// Routes
router.post('/', createTimelineValidation, timelineController.create);
router.get('/:id', timelineController.getById);
router.post('/:id/steps', addStepValidation, timelineController.addStep);
router.post('/:id/complete', timelineController.complete);
router.get('/student/:studentId', timelineController.getByStudentId);
router.get('/student/:studentId/stats', timelineController.getStudentStats);

module.exports = router;
