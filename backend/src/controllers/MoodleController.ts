import { Request, Response, NextFunction } from 'express'
import { MoodleService } from '../services/MoodleService'
import type { ApiResponse } from '../types'

const moodleService = new MoodleService()

export class MoodleController {
  async fetchProblems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.query
      const token = req.headers['x-moodle-token'] as string

      if (!courseId) {
        res.status(400).json({
          success: false,
          error: 'courseId is required'
        })
        return
      }

      const problems = await moodleService.fetchProblems(Number(courseId), token)

      const response: ApiResponse = {
        success: true,
        data: problems
      }
      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async submitGrade(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { attemptId, grade } = req.body
      const token = req.headers['x-moodle-token'] as string

      if (!attemptId || grade === undefined) {
        res.status(400).json({
          success: false,
          error: 'attemptId and grade are required'
        })
        return
      }

      await moodleService.submitGrade(attemptId, grade, token)

      const response: ApiResponse = {
        success: true,
        message: 'Grade submitted to Moodle successfully'
      }
      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async getCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.headers['x-moodle-token'] as string
      const courses = await moodleService.getUserCourses(token)

      const response: ApiResponse = {
        success: true,
        data: courses
      }
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
}
