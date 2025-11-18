import { Request, Response } from 'express';
import { Database } from '../models/Database.js';

const db = new Database();

export const problemController = {
  // 모든 문제 가져오기
  async getAllProblems(req: Request, res: Response) {
    try {
      const problems = await db.getAllProblems();
      res.json({
        success: true,
        data: problems,
      });
    } catch (error) {
      console.error('Error fetching problems:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch problems',
      });
    }
  },

  // 특정 문제 가져오기
  async getProblemById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const problem = await db.getProblemById(id);

      if (!problem) {
        return res.status(404).json({
          success: false,
          error: 'Problem not found',
        });
      }

      res.json({
        success: true,
        data: problem,
      });
    } catch (error) {
      console.error('Error fetching problem:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch problem',
      });
    }
  },

  // 랜덤 문제 가져오기
  async getRandomProblem(req: Request, res: Response) {
    try {
      const problem = await db.getRandomProblem();

      if (!problem) {
        return res.status(404).json({
          success: false,
          error: 'No problems available',
        });
      }

      res.json({
        success: true,
        data: problem,
      });
    } catch (error) {
      console.error('Error fetching random problem:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch random problem',
      });
    }
  },

  // 답안 제출
  async submitAnswer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { conditionType, isCorrect } = req.body;

      // 답안 저장
      await db.saveAnswer({
        problemId: id,
        conditionType,
        isCorrect,
        timestamp: new Date(),
      });

      // 문제 정보 가져오기
      const problem = await db.getProblemById(id);

      res.json({
        success: true,
        data: {
          correct: isCorrect,
          explanation: problem?.explanation,
        },
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit answer',
      });
    }
  },

  // 통계 가져오기
  async getStatistics(req: Request, res: Response) {
    try {
      const stats = await db.getStatistics();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
      });
    }
  },
};
