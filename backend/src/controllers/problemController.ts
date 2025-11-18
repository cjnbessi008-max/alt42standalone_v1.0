import { Request, Response, NextFunction } from 'express';
import problemModel from '../models/problemModel';
import submissionModel from '../models/submissionModel';
import validationService from '../services/validationService';
import aiService from '../services/aiService';
import { SubmitAnswerRequest, SubmitAnswerResponse, Fraction, FractionProblemData } from '../types';
import logger from '../utils/logger';

export class ProblemController {
  /**
   * Get all problems
   */
  async getAllProblems(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, difficulty, limit, offset } = req.query;

      const problems = await problemModel.getAll({
        type: type as any,
        difficulty: difficulty as any,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json({
        status: 'success',
        data: problems,
        count: problems.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get problem by ID
   */
  async getProblemById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const problem = await problemModel.getById(id);

      res.json({
        status: 'success',
        data: problem,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get random problem
   */
  async getRandomProblem(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, difficulty } = req.query;

      const problem = await problemModel.getRandom(type as any, difficulty as any);

      res.json({
        status: 'success',
        data: problem,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new problem (teacher only)
   */
  async createProblem(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Get teacher ID from auth middleware
      const teacherId = req.body.teacher_id; // Temporary

      const problem = await problemModel.create(req.body, teacherId);

      res.status(201).json({
        status: 'success',
        data: problem,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit answer for validation
   */
  async submitAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: problemId } = req.params;
      const { student_answer, time_spent_seconds } = req.body as SubmitAnswerRequest;

      // TODO: Get student ID from auth middleware
      const studentId = req.body.student_id || '00000000-0000-0000-0000-000000000001'; // Temporary

      logger.info(`Student ${studentId} submitted answer for problem ${problemId}`);

      // Get the problem
      const problem = await problemModel.getById(problemId);

      // Validate the answer
      const validation = validationService.validateAnswer(
        student_answer as Fraction,
        problem.correct_answer as Fraction,
        problem.problem_data as FractionProblemData
      );

      logger.info(`Validation result: ${JSON.stringify(validation)}`);

      // Generate error analysis if incorrect
      let errorAnalysis;
      if (!validation.is_correct) {
        errorAnalysis = await aiService.generateErrorAnalysis(
          problem.problem_data as FractionProblemData,
          student_answer as Fraction,
          problem.correct_answer as Fraction,
          validation.error_type
        );

        logger.info(`Generated error analysis: ${JSON.stringify(errorAnalysis)}`);
      }

      // Save submission
      const submission = await submissionModel.create({
        student_id: studentId,
        problem_id: problemId,
        student_answer: student_answer as Record<string, unknown>,
        is_correct: validation.is_correct,
        is_equivalent: validation.is_equivalent,
        error_type: validation.error_type,
        error_analysis: errorAnalysis,
        time_spent_seconds,
      });

      const response: SubmitAnswerResponse = {
        submission_id: submission.id,
        is_correct: validation.is_correct,
        is_equivalent: validation.is_equivalent,
        error_type: validation.error_type,
        error_analysis: errorAnalysis,
        correct_answer: problem.correct_answer as Fraction,
      };

      res.json({
        status: 'success',
        data: response,
      });
    } catch (error) {
      logger.error('Error in submitAnswer:', error);
      next(error);
    }
  }

  /**
   * Get submissions for a problem
   */
  async getProblemSubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

      const submissions = await submissionModel.getByProblem(id, limit);

      res.json({
        status: 'success',
        data: submissions,
        count: submissions.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProblemController();
