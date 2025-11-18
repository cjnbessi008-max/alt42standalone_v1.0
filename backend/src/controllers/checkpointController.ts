import { Request, Response } from 'express';
import { SubmissionModel, CheckpointValidationModel } from '../models/submissionModel';
import { ProblemModel } from '../models/problemModel';
import { ValidationService } from '../services/validationService';
import { logger } from '../config/logger';
import {
  CreateSubmissionRequest,
  ValidateCheckpointRequest,
  CheckpointResponse,
  ValidationRule
} from '../types';

export class CheckpointController {
  /**
   * Create a new submission (initial answer input)
   */
  static async createSubmission(req: Request, res: Response): Promise<void> {
    try {
      const { student_id, problem_id, answer, time_spent_seconds } = req.body as CreateSubmissionRequest;

      // Validate input
      if (!student_id || !problem_id || answer === undefined) {
        res.status(400).json({
          success: false,
          error: 'student_id, problem_id, and answer are required'
        });
        return;
      }

      // Check if problem exists
      const problem = ProblemModel.findById(problem_id);
      if (!problem) {
        res.status(404).json({
          success: false,
          error: 'Problem not found'
        });
        return;
      }

      // Create submission
      const submission = SubmissionModel.create(
        student_id,
        problem_id,
        answer,
        time_spent_seconds
      );

      logger.info('Submission created via API', { submissionId: submission.id });

      res.status(201).json({
        success: true,
        data: {
          submission_id: submission.id,
          attempt_number: submission.attempt_number,
          status: submission.status
        }
      });
    } catch (error) {
      logger.error('Error creating submission:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create submission'
      });
    }
  }

  /**
   * Validate checkpoint - perform all validations before final submission
   */
  static async validateCheckpoint(req: Request, res: Response): Promise<void> {
    try {
      const { submission_id, perform_full_validation = true } = req.body as ValidateCheckpointRequest;

      if (!submission_id) {
        res.status(400).json({
          success: false,
          error: 'submission_id is required'
        });
        return;
      }

      // Get submission with problem details
      const submissionWithProblem = SubmissionModel.findByIdWithProblem(submission_id);
      if (!submissionWithProblem) {
        res.status(404).json({
          success: false,
          error: 'Submission not found'
        });
        return;
      }

      const { problem, answer: answerStr } = submissionWithProblem;

      // Parse JSON strings
      const answer = JSON.parse(answerStr);
      const correctAnswer = JSON.parse(problem.correct_answer);
      const validationRules: ValidationRule = JSON.parse(problem.validation_rules);

      // Perform validation
      const validationResults = await ValidationService.validateCheckpoint(
        answer,
        correctAnswer,
        validationRules
      );

      // Store validation results
      CheckpointValidationModel.createMultiple(
        submission_id,
        validationResults.map(v => ({
          validation_type: v.validation_type,
          passed: v.passed,
          error_message: v.error_message,
          warning_message: v.warning_message,
          suggestions: v.suggestions
        }))
      );

      // Calculate overall pass status
      const overallPassed = validationResults.every(v => v.passed);

      // Calculate preview score
      const scorePreview = ValidationService.calculateScore(
        validationResults,
        problem.points
      );

      // Update submission with preview score
      if (perform_full_validation) {
        SubmissionModel.updateScoreAndFeedback(
          submission_id,
          scorePreview,
          {
            validations: validationResults,
            overall_passed: overallPassed,
            preview: true
          }
        );
      }

      const response: CheckpointResponse = {
        submission_id,
        validations: validationResults,
        overall_passed: overallPassed,
        can_submit: overallPassed || submissionWithProblem.attempt_number < problem.max_attempts,
        score_preview: scorePreview,
        feedback_preview: overallPassed
          ? '모든 검증을 통과했습니다! 제출할 수 있습니다.'
          : '일부 검증에 실패했습니다. 피드백을 확인하고 수정해주세요.'
      };

      logger.info('Checkpoint validation completed', {
        submissionId: submission_id,
        overallPassed,
        scorePreview
      });

      res.status(200).json({
        success: true,
        data: response
      });
    } catch (error) {
      logger.error('Error validating checkpoint:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate checkpoint'
      });
    }
  }

  /**
   * Get submission details with validation history
   */
  static async getSubmission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const submission = SubmissionModel.findByIdWithProblem(id);
      if (!submission) {
        res.status(404).json({
          success: false,
          error: 'Submission not found'
        });
        return;
      }

      // Get validation history
      const validations = CheckpointValidationModel.findBySubmission(id);

      res.status(200).json({
        success: true,
        data: {
          ...submission,
          answer: JSON.parse(submission.answer),
          feedback: submission.feedback ? JSON.parse(submission.feedback) : null,
          validations: validations.map(v => ({
            ...v,
            suggestions: v.suggestions ? JSON.parse(v.suggestions) : null
          }))
        }
      });
    } catch (error) {
      logger.error('Error getting submission:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get submission'
      });
    }
  }

  /**
   * Get all submissions for a student
   */
  static async getStudentSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;

      const submissions = SubmissionModel.findByStudent(studentId);

      res.status(200).json({
        success: true,
        data: submissions.map(s => ({
          ...s,
          answer: JSON.parse(s.answer),
          feedback: s.feedback ? JSON.parse(s.feedback) : null
        }))
      });
    } catch (error) {
      logger.error('Error getting student submissions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get student submissions'
      });
    }
  }
}
