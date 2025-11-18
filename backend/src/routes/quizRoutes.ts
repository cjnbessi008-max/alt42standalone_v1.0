import { Router, Request, Response } from 'express';
import moodleService from '../services/moodleService';
import databaseService from '../services/databaseService';
import { ApiResponse, QuizProblem } from '../types';

const router = Router();

/**
 * GET /api/quiz/:quizId
 * Get quiz with all questions and trap points
 */
router.get('/:quizId', async (req: Request, res: Response) => {
  try {
    const quizId = parseInt(req.params.quizId);

    if (isNaN(quizId)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid quiz ID',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    // Get quiz metadata from Moodle
    const quiz = await moodleService.getQuiz(quizId);

    if (!quiz) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Quiz not found',
        timestamp: new Date().toISOString(),
      };
      return res.status(404).json(response);
    }

    // Get questions from database
    const questions = await databaseService.getQuizQuestions(quizId);

    // Get trap points for each question
    const problems: QuizProblem[] = await Promise.all(
      questions.map(async (question) => {
        const answers = await databaseService.getQuestionAnswers(question.id);
        const trapPoints = await databaseService.getTrapPoints(question.id);

        return {
          question,
          answers,
          trapPoints,
        };
      })
    );

    const response: ApiResponse<{ quiz: any; problems: QuizProblem[] }> = {
      success: true,
      data: {
        quiz,
        problems,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/quiz/:quizId:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

export default router;
