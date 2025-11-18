import { Router, Request, Response } from 'express';
import { MoodleApiService } from '../services/moodleApi.service';

export function createMoodleRouter(moodleApi: MoodleApiService): Router {
  const router = Router();

  /**
   * GET /api/moodle/quizzes
   * Get all quizzes
   */
  router.get('/quizzes', async (req: Request, res: Response) => {
    try {
      const quizzes = await moodleApi.getAllQuizzes();
      res.json({
        success: true,
        data: quizzes,
        count: quizzes.length
      });
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quizzes',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/moodle/quizzes/:id
   * Get quiz by ID
   */
  router.get('/quizzes/:id', async (req: Request, res: Response) => {
    try {
      const quizId = parseInt(req.params.id, 10);

      if (isNaN(quizId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid quiz ID'
        });
      }

      const quiz = await moodleApi.getQuizById(quizId);

      if (!quiz) {
        return res.status(404).json({
          success: false,
          error: 'Quiz not found'
        });
      }

      res.json({
        success: true,
        data: quiz
      });
    } catch (error) {
      console.error(`Error fetching quiz ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quiz',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/moodle/quizzes/:id/attempts
   * Get all attempts for a quiz
   */
  router.get('/quizzes/:id/attempts', async (req: Request, res: Response) => {
    try {
      const quizId = parseInt(req.params.id, 10);

      if (isNaN(quizId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid quiz ID'
        });
      }

      const attempts = await moodleApi.getQuizAttempts(quizId);

      res.json({
        success: true,
        data: attempts,
        count: attempts.length
      });
    } catch (error) {
      console.error(`Error fetching attempts for quiz ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quiz attempts',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/moodle/attempts/:id
   * Get attempt data including questions
   */
  router.get('/attempts/:id', async (req: Request, res: Response) => {
    try {
      const attemptId = parseInt(req.params.id, 10);

      if (isNaN(attemptId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid attempt ID'
        });
      }

      const attemptData = await moodleApi.getAttemptData(attemptId);

      res.json({
        success: true,
        data: attemptData
      });
    } catch (error) {
      console.error(`Error fetching attempt ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch attempt data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/moodle/courses/:courseId/students
   * Get students enrolled in a course
   */
  router.get('/courses/:courseId/students', async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.courseId, 10);

      if (isNaN(courseId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid course ID'
        });
      }

      const students = await moodleApi.getCourseStudents(courseId);

      res.json({
        success: true,
        data: students,
        count: students.length
      });
    } catch (error) {
      console.error(`Error fetching students for course ${req.params.courseId}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch course students',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
