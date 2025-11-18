import { Request, Response } from 'express';
import { AttemptModel } from '../models/Attempt.js';
import { reportScore } from '../middleware/lti.js';

export const attemptController = {
  // 모든 시도 조회
  async getAll(req: Request, res: Response) {
    try {
      const { studentId, problemId } = req.query;

      let attempts;

      if (studentId && problemId) {
        attempts = await AttemptModel.findByStudentAndProblem(
          studentId as string,
          parseInt(problemId as string)
        );
      } else if (studentId) {
        attempts = await AttemptModel.findByStudentId(studentId as string);
      } else if (problemId) {
        attempts = await AttemptModel.findByProblemId(parseInt(problemId as string));
      } else {
        attempts = await AttemptModel.findAll();
      }

      res.json(attempts);
    } catch (error) {
      console.error('Error fetching attempts:', error);
      res.status(500).json({ error: 'Failed to fetch attempts' });
    }
  },

  // 특정 시도 조회
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid attempt ID' });
      }

      const attempt = await AttemptModel.findById(id);

      if (!attempt) {
        return res.status(404).json({ error: 'Attempt not found' });
      }

      res.json(attempt);
    } catch (error) {
      console.error('Error fetching attempt:', error);
      res.status(500).json({ error: 'Failed to fetch attempt' });
    }
  },

  // 시도 생성 (답안 제출)
  async create(req: Request, res: Response) {
    try {
      const attempt = await AttemptModel.create({
        ...req.body,
        timestamp: new Date(),
      });

      // LTI 세션이 있으면 성적 보고
      const ltiSession = (req.session as any)?.lti || (req as any).lti;

      if (
        ltiSession &&
        ltiSession.lisOutcomeServiceUrl &&
        ltiSession.lisResultSourcedId
      ) {
        try {
          // 점수를 0.0 ~ 1.0 범위로 변환
          const normalizedScore = attempt.result.score / 100;

          await reportScore(
            ltiSession.lisOutcomeServiceUrl,
            ltiSession.lisResultSourcedId,
            normalizedScore
          );

          console.log(`Score ${attempt.result.score} reported to LMS successfully`);
        } catch (error) {
          console.error('Failed to report score to LMS:', error);
          // 성적 보고 실패해도 시도 저장은 성공으로 처리
        }
      }

      res.status(201).json(attempt);
    } catch (error) {
      console.error('Error creating attempt:', error);
      res.status(500).json({ error: 'Failed to create attempt' });
    }
  },

  // 통계 조회
  async getStatistics(req: Request, res: Response) {
    try {
      const { studentId, problemId } = req.query;

      const stats = await AttemptModel.getStatistics(
        problemId ? parseInt(problemId as string) : undefined,
        studentId as string | undefined
      );

      res.json(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  },
};
