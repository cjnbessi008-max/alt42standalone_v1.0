import { Request, Response, NextFunction } from 'express'
import { AttemptService } from '../services/AttemptService'
import type { ApiResponse, StudentAttempt } from '../types'

const attemptService = new AttemptService()

export class AttemptController {
  async submitAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attemptData = req.body
      const attempt = await attemptService.submitAttempt(attemptData)

      const response: ApiResponse<StudentAttempt> = {
        success: true,
        data: attempt,
        message: 'Attempt submitted successfully'
      }
      res.status(201).json(response)
    } catch (error) {
      next(error)
    }
  }

  async getAttemptsByStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.params
      const attempts = await attemptService.getAttemptsByStudent(studentId)

      const response: ApiResponse<StudentAttempt[]> = {
        success: true,
        data: attempts
      }
      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async getAttemptsByProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { problemId } = req.params
      const attempts = await attemptService.getAttemptsByProblem(problemId)

      const response: ApiResponse<StudentAttempt[]> = {
        success: true,
        data: attempts
      }
      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async getAttemptById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const attempt = await attemptService.getAttemptById(id)

      if (!attempt) {
        res.status(404).json({
          success: false,
          error: 'Attempt not found'
        })
        return
      }

      const response: ApiResponse<StudentAttempt> = {
        success: true,
        data: attempt
      }
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
}
