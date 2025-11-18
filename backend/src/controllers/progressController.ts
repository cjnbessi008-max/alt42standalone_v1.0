import { Request, Response } from 'express';
import { StudentProgressModel } from '../models/StudentProgress';
import logger from '../config/logger';

export const submitProgress = async (req: Request, res: Response) => {
  try {
    const { studentId, problemId, score, timeSpent, attempts } = req.body;

    if (!studentId || !problemId || score === undefined || !timeSpent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const progress = await StudentProgressModel.create({
      studentId,
      problemId,
      score,
      timeSpent,
      attempts: attempts || 1,
      completedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    logger.error('Error submitting progress:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const getStudentProgress = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const progress = await StudentProgressModel.findByStudent(studentId, limit);

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    logger.error('Error getting student progress:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const getStudentStats = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const stats = await StudentProgressModel.getStats(studentId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting student stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const getProblemProgress = async (req: Request, res: Response) => {
  try {
    const { problemId } = req.params;

    const progress = await StudentProgressModel.findByProblem(problemId);

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    logger.error('Error getting problem progress:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
