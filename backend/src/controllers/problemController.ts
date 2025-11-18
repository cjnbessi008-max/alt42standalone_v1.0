import { Request, Response } from 'express';
import { ProblemModel } from '../models/Problem';
import logger from '../config/logger';

export const getRandomProblem = async (req: Request, res: Response) => {
  try {
    const { difficulty } = req.query;

    const problem = await ProblemModel.findRandom(difficulty as string);

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'No problems found',
      });
    }

    res.json({
      success: true,
      data: problem,
    });
  } catch (error) {
    logger.error('Error getting random problem:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const getProblemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const problem = await ProblemModel.findById(id);

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
    logger.error('Error getting problem by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const getAllProblems = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const problems = await ProblemModel.findAll(limit);

    res.json({
      success: true,
      data: problems,
    });
  } catch (error) {
    logger.error('Error getting all problems:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const createProblem = async (req: Request, res: Response) => {
  try {
    const { number, divisors, difficulty, timeLimit } = req.body;

    if (!number || !divisors || !difficulty) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const problem = await ProblemModel.create({
      number,
      divisors,
      difficulty,
      timeLimit,
    });

    res.status(201).json({
      success: true,
      data: problem,
    });
  } catch (error) {
    logger.error('Error creating problem:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
