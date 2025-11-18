/**
 * Student Controller
 * Handles student-related API endpoints
 */

import { Request, Response } from 'express';
import { StudentModel } from '../models/studentModel';
import { ProblemModel } from '../models/problemModel';
import { DifficultyAdjustmentService } from '../services/difficultyAdjustmentService';
import {
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  GetNextProblemResponse,
} from '../../../shared/types';

const difficultyService = new DifficultyAdjustmentService();

export class StudentController {
  /**
   * GET /api/students/:id
   * Get student profile and performance
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const student = await StudentModel.findById(id);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const metrics = await StudentModel.getPerformanceMetrics(id);
      const recentAttempts = await StudentModel.getRecentAttempts(id, 5);
      const difficultyHistory = await StudentModel.getDifficultyHistory(id, 5);

      res.json({
        student,
        metrics,
        recentAttempts,
        difficultyHistory,
      });
    } catch (error) {
      console.error('Error getting student profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/students/:id/next-problem
   * Get next problem based on current difficulty
   */
  static async getNextProblem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const student = await StudentModel.findById(id);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      // Get recently attempted problems to avoid repetition
      const recentAttempts = await StudentModel.getRecentAttempts(id, 20);
      const recentProblemIds = recentAttempts.map(a => a.problemId);

      // Get random problem at student's current difficulty
      const problem = await ProblemModel.getRandomByDifficulty(
        student.currentDifficulty,
        recentProblemIds
      );

      if (!problem) {
        res.status(404).json({ error: 'No problems available at this difficulty' });
        return;
      }

      const metrics = await StudentModel.getPerformanceMetrics(id);

      // Don't send correct answer to client
      const { correctAnswer, ...problemWithoutAnswer } = problem;

      const response: GetNextProblemResponse = {
        problem: problemWithoutAnswer as any,
        currentDifficulty: student.currentDifficulty,
        studentMetrics: metrics!,
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting next problem:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/students/:id/submit
   * Submit answer and get feedback with difficulty adjustment
   */
  static async submitAnswer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { problemId, answer, timeSpent } = req.body as SubmitAnswerRequest;

      // Validate input
      if (!problemId || !answer || timeSpent === undefined) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const student = await StudentModel.findById(id);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const problem = await ProblemModel.findById(problemId);
      if (!problem) {
        res.status(404).json({ error: 'Problem not found' });
        return;
      }

      // Check if answer is correct
      const isCorrect = this.checkAnswer(answer, problem.correctAnswer);

      // Record attempt
      await StudentModel.recordAttempt(
        id,
        problemId,
        answer,
        isCorrect,
        timeSpent,
        student.currentDifficulty
      );

      // Update student statistics
      const newTotal = student.totalProblemsAttempted + 1;
      const newCorrect = student.totalCorrect + (isCorrect ? 1 : 0);
      const newAvgTime =
        (student.averageSolveTime * student.totalProblemsAttempted + timeSpent) / newTotal;
      const newPerformanceScore = (newCorrect / newTotal) * 100;

      await StudentModel.updatePerformanceMetrics(
        id,
        newTotal,
        newCorrect,
        newAvgTime,
        newPerformanceScore
      );

      // Get all attempts for difficulty adjustment
      const recentAttempts = await StudentModel.getRecentAttempts(id, 10);
      const allAttempts = await StudentModel.getAllAttempts(id);

      // Calculate recommended difficulty
      const expectedTimes = DifficultyAdjustmentService.getDefaultExpectedTimes();
      const adjustment = difficultyService.calculateRecommendedDifficulty(
        student.currentDifficulty,
        recentAttempts,
        allAttempts,
        expectedTimes
      );

      // Update difficulty if changed
      let newDifficulty = student.currentDifficulty;
      if (adjustment.newDifficulty !== student.currentDifficulty) {
        newDifficulty = adjustment.newDifficulty;
        await StudentModel.updateDifficulty(id, newDifficulty);
        await StudentModel.recordDifficultyAdjustment(id, adjustment);
      }

      // Get updated metrics
      const updatedStudent = await StudentModel.findById(id);
      const metrics = await StudentModel.getPerformanceMetrics(id);

      // Get next problem
      const recentProblemIds = recentAttempts.map(a => a.problemId);
      recentProblemIds.push(problemId);
      const nextProblem = await ProblemModel.getRandomByDifficulty(
        newDifficulty,
        recentProblemIds
      );

      const response: SubmitAnswerResponse = {
        isCorrect,
        correctAnswer: problem.correctAnswer,
        explanation: isCorrect
          ? 'Great job! That\'s correct.'
          : `The correct answer is: ${problem.correctAnswer}`,
        newDifficulty,
        nextProblem: nextProblem
          ? { ...nextProblem, correctAnswer: '' as any }
          : undefined,
        performanceUpdate: metrics!,
      };

      res.json(response);
    } catch (error) {
      console.error('Error submitting answer:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/students/:id/progress
   * Get detailed progress information
   */
  static async getProgress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const student = await StudentModel.findById(id);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const metrics = await StudentModel.getPerformanceMetrics(id);
      const recentAttempts = await StudentModel.getRecentAttempts(id, 20);
      const difficultyHistory = await StudentModel.getDifficultyHistory(id);

      res.json({
        student,
        performanceMetrics: metrics,
        recentAttempts,
        difficultyHistory,
      });
    } catch (error) {
      console.error('Error getting student progress:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Helper: Check if answer is correct
   */
  private static checkAnswer(studentAnswer: string, correctAnswer: string): boolean {
    // Normalize answers (trim, lowercase, remove extra spaces)
    const normalize = (str: string) =>
      str.trim().toLowerCase().replace(/\s+/g, ' ');

    return normalize(studentAnswer) === normalize(correctAnswer);
  }
}

export default StudentController;
