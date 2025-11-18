import { Request, Response } from 'express';
import moodleService from '../services/moodleService';
import { ProblemModel } from '../models/Problem';
import { ApiResponse } from '../types';

export const moodleController = {
  // GET /api/v1/moodle/test
  async testConnection(req: Request, res: Response) {
    try {
      const connected = await moodleService.testConnection();

      const response: ApiResponse = {
        success: connected,
        message: connected
          ? 'Moodle connection successful'
          : 'Moodle connection failed',
      };

      res.json(response);
    } catch (error) {
      console.error('Error testing Moodle connection:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to test Moodle connection',
      };
      res.status(500).json(response);
    }
  },

  // POST /api/v1/moodle/import-quiz/:quizId
  async importQuiz(req: Request, res: Response) {
    try {
      const quizId = parseInt(req.params.quizId);

      if (isNaN(quizId)) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid quiz ID',
        };
        return res.status(400).json(response);
      }

      const questions = await moodleService.getQuizQuestions(quizId);

      const importedProblems = [];
      const errors = [];

      for (const question of questions) {
        try {
          const problem = await moodleService.importQuestionAsProblem(question);

          if (problem) {
            const created = await ProblemModel.create(problem);
            importedProblems.push(created);
          } else {
            errors.push({
              questionId: question.id,
              error: 'Failed to parse question',
            });
          }
        } catch (error: any) {
          errors.push({
            questionId: question.id,
            error: error.message,
          });
        }
      }

      const response: ApiResponse = {
        success: true,
        data: {
          imported: importedProblems.length,
          errors: errors.length,
          problems: importedProblems,
          failed: errors,
        },
        message: `Imported ${importedProblems.length} problems from Moodle quiz`,
      };

      res.json(response);
    } catch (error) {
      console.error('Error importing quiz:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to import quiz from Moodle',
      };
      res.status(500).json(response);
    }
  },
};
