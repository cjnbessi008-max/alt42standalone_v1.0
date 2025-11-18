import { Request, Response } from 'express';
import { StudentSessionModel, StudentAttemptModel } from '../models/StudentSession';
import { ProblemModel } from '../models/Problem';
import { ApiResponse } from '../types';
import { randomBytes } from 'crypto';

export const sessionController = {
  // POST /api/v1/sessions
  async create(req: Request, res: Response) {
    try {
      const { student_name, moodle_user_id } = req.body;

      // Generate unique session ID
      const session_id = randomBytes(16).toString('hex');

      const session = await StudentSessionModel.create(
        session_id,
        student_name,
        moodle_user_id
      );

      const response: ApiResponse = {
        success: true,
        data: session,
        message: 'Session created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating session:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to create session',
      };
      res.status(500).json(response);
    }
  },

  // GET /api/v1/sessions/:session_id
  async getBySessionId(req: Request, res: Response) {
    try {
      const { session_id } = req.params;

      const session = await StudentSessionModel.getBySessionId(session_id);

      if (!session) {
        const response: ApiResponse = {
          success: false,
          error: 'Session not found',
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse = {
        success: true,
        data: session,
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching session:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch session',
      };
      res.status(500).json(response);
    }
  },

  // POST /api/v1/sessions/:session_id/attempts
  async submitAttempt(req: Request, res: Response) {
    try {
      const { session_id } = req.params;
      const {
        problem_id,
        student_answer,
        time_spent_seconds,
        interaction_data,
      } = req.body;

      // Get session
      const session = await StudentSessionModel.getBySessionId(session_id);
      if (!session || !session.id) {
        const response: ApiResponse = {
          success: false,
          error: 'Session not found',
        };
        return res.status(404).json(response);
      }

      // Get problem
      const problem = await ProblemModel.getById(problem_id);
      if (!problem) {
        const response: ApiResponse = {
          success: false,
          error: 'Problem not found',
        };
        return res.status(404).json(response);
      }

      // Check if answer is correct
      const is_correct =
        student_answer.toString().trim() ===
        problem.correct_answer.toString().trim();

      // Create attempt
      const attempt = await StudentAttemptModel.create({
        session_id: session.id,
        problem_id,
        student_answer,
        is_correct,
        time_spent_seconds,
        interaction_data,
      });

      // Update session stats
      await StudentSessionModel.updateStats(session.id, true, is_correct);

      const response: ApiResponse = {
        success: true,
        data: {
          attempt,
          is_correct,
          correct_answer: problem.correct_answer,
        },
        message: is_correct
          ? 'Correct answer! Well done!'
          : 'Incorrect answer. Try again!',
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error submitting attempt:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to submit attempt',
      };
      res.status(500).json(response);
    }
  },

  // GET /api/v1/sessions/:session_id/attempts
  async getAttempts(req: Request, res: Response) {
    try {
      const { session_id } = req.params;

      const session = await StudentSessionModel.getBySessionId(session_id);
      if (!session || !session.id) {
        const response: ApiResponse = {
          success: false,
          error: 'Session not found',
        };
        return res.status(404).json(response);
      }

      const attempts = await StudentAttemptModel.getBySession(session.id);

      const response: ApiResponse = {
        success: true,
        data: attempts,
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching attempts:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch attempts',
      };
      res.status(500).json(response);
    }
  },

  // GET /api/v1/sessions/:session_id/stats
  async getStats(req: Request, res: Response) {
    try {
      const { session_id } = req.params;

      const session = await StudentSessionModel.getBySessionId(session_id);
      if (!session || !session.id) {
        const response: ApiResponse = {
          success: false,
          error: 'Session not found',
        };
        return res.status(404).json(response);
      }

      const attempts = await StudentAttemptModel.getBySession(session.id);

      const stats = {
        total_attempted: session.total_problems_attempted || 0,
        total_correct: session.total_correct_answers || 0,
        accuracy:
          session.total_problems_attempted && session.total_problems_attempted > 0
            ? Math.round(
                ((session.total_correct_answers || 0) /
                  session.total_problems_attempted) *
                  100
              )
            : 0,
        session_duration_minutes: session.started_at
          ? Math.round(
              (new Date().getTime() - new Date(session.started_at).getTime()) /
                60000
            )
          : 0,
        recent_attempts: attempts.slice(0, 5),
      };

      const response: ApiResponse = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching stats:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch stats',
      };
      res.status(500).json(response);
    }
  },
};
