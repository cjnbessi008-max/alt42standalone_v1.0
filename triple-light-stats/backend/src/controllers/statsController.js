const moodleService = require('../services/moodleService');
const statsService = require('../services/statsService');

/**
 * Statistics Controller
 * Handles HTTP requests for statistics endpoints
 */

class StatsController {
  /**
   * GET /api/quizzes
   * Get list of all quizzes
   */
  async getQuizzes(req, res) {
    try {
      const quizzes = await moodleService.getQuizList();

      res.json({
        success: true,
        data: quizzes,
        count: quizzes.length
      });
    } catch (error) {
      console.error('Error in getQuizzes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quizzes',
        message: error.message
      });
    }
  }

  /**
   * GET /api/stats/:quizId
   * Get statistics for a specific quiz
   */
  async getQuizStats(req, res) {
    try {
      const quizId = parseInt(req.params.quizId);

      if (!quizId || isNaN(quizId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid quiz ID'
        });
      }

      // Fetch quiz details and grades in parallel
      const [quizDetails, gradeData] = await Promise.all([
        moodleService.getQuizDetails(quizId),
        moodleService.getQuizGrades(quizId)
      ]);

      // Extract grade values
      const grades = gradeData.map(item => item.grade);

      // Calculate statistics
      const statistics = statsService.calculateAll(grades);

      res.json({
        success: true,
        data: {
          quizId: quizDetails.id,
          quizName: quizDetails.name,
          courseName: quizDetails.courseName,
          maxGrade: quizDetails.maxGrade,
          statistics,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getQuizStats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quiz statistics',
        message: error.message
      });
    }
  }

  /**
   * GET /api/stats/:quizId/attempts
   * Get detailed attempt statistics
   */
  async getAttemptStats(req, res) {
    try {
      const quizId = parseInt(req.params.quizId);

      if (!quizId || isNaN(quizId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid quiz ID'
        });
      }

      const attempts = await moodleService.getQuizAttempts(quizId);
      const grades = attempts.map(attempt => attempt.grade);
      const statistics = statsService.calculateAll(grades);

      res.json({
        success: true,
        data: {
          quizId,
          statistics,
          attempts,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getAttemptStats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch attempt statistics',
        message: error.message
      });
    }
  }

  /**
   * GET /api/stats/:quizId/questions
   * Get question-level statistics
   */
  async getQuestionStats(req, res) {
    try {
      const quizId = parseInt(req.params.quizId);

      if (!quizId || isNaN(quizId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid quiz ID'
        });
      }

      const questions = await moodleService.getQuestionStats(quizId);

      res.json({
        success: true,
        data: {
          quizId,
          questions,
          count: questions.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getQuestionStats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch question statistics',
        message: error.message
      });
    }
  }

  /**
   * GET /api/health
   * Health check endpoint
   */
  async healthCheck(req, res) {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }
}

module.exports = new StatsController();
