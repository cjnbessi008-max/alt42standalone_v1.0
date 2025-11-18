/**
 * Moodle API 컨트롤러
 */

import { Request, Response } from 'express'
import moodleService from '../services/moodle.service.js'

export class MoodleController {
  /**
   * GET /api/moodle/questions
   * 문제 목록 조회
   */
  async getQuestions(req: Request, res: Response) {
    try {
      const category = req.query.category ? parseInt(req.query.category as string) : undefined
      const qtype = req.query.type as string | undefined
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0

      const result = await moodleService.getQuestions({
        category,
        qtype,
        limit,
        offset,
      })

      res.json(result)
    } catch (error) {
      console.error('Error fetching questions:', error)
      res.status(500).json({
        error: 'Failed to fetch questions',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /api/moodle/question/:id
   * 특정 문제 상세 조회
   */
  async getQuestionById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)

      if (isNaN(id)) {
        res.status(400).json({
          error: 'Invalid question ID',
        })
        return
      }

      const question = await moodleService.getQuestionById(id)

      if (!question) {
        res.status(404).json({
          error: 'Question not found',
        })
        return
      }

      res.json(question)
    } catch (error) {
      console.error('Error fetching question:', error)
      res.status(500).json({
        error: 'Failed to fetch question',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /api/moodle/categories
   * 문제 카테고리 목록 조회
   */
  async getCategories(req: Request, res: Response) {
    try {
      const categories = await moodleService.getCategories()
      res.json({ categories })
    } catch (error) {
      console.error('Error fetching categories:', error)
      res.status(500).json({
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /api/moodle/statistics
   * 문제 통계
   */
  async getStatistics(req: Request, res: Response) {
    try {
      const stats = await moodleService.getStatistics()
      res.json(stats)
    } catch (error) {
      console.error('Error fetching statistics:', error)
      res.status(500).json({
        error: 'Failed to fetch statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

export default new MoodleController()
