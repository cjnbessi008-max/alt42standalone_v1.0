/**
 * Moodle API 라우트
 * Moodle 3.7 Web Services와 통신
 */

import { Router, Request, Response } from 'express';
import { moodleService } from '../services/moodleService.js';

const router = Router();

/**
 * GET /api/moodle/questions
 * Moodle에서 문제 목록 가져오기
 */
router.get('/questions', async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const questions = await moodleService.getQuestions(categoryId);

    res.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions from Moodle',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/moodle/questions/:id
 * 특정 문제 정보 가져오기
 */
router.get('/questions/:id', async (req: Request, res: Response) => {
  try {
    const questionId = Number(req.params.id);
    const question = await moodleService.getQuestion(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found',
      });
    }

    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error('Failed to fetch question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch question from Moodle',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/moodle/categories
 * 문제 카테고리 목록 가져오기
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await moodleService.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories from Moodle',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as moodleRoutes };
