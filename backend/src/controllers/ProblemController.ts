import { Request, Response, NextFunction } from 'express'
import { ProblemService } from '../services/ProblemService'
import type { ApiResponse, Problem } from '../types'

const problemService = new ProblemService()

export class ProblemController {
  async getAllProblems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const problems = await problemService.getAllProblems()
      const response: ApiResponse<Problem[]> = {
        success: true,
        data: problems
      }
      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async getProblemById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const problem = await problemService.getProblemById(id)

      if (!problem) {
        res.status(404).json({
          success: false,
          error: 'Problem not found'
        })
        return
      }

      const response: ApiResponse<Problem> = {
        success: true,
        data: problem
      }
      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async createProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const problemData = req.body
      const problem = await problemService.createProblem(problemData)

      const response: ApiResponse<Problem> = {
        success: true,
        data: problem,
        message: 'Problem created successfully'
      }
      res.status(201).json(response)
    } catch (error) {
      next(error)
    }
  }

  async updateProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const problemData = req.body
      const problem = await problemService.updateProblem(id, problemData)

      if (!problem) {
        res.status(404).json({
          success: false,
          error: 'Problem not found'
        })
        return
      }

      const response: ApiResponse<Problem> = {
        success: true,
        data: problem,
        message: 'Problem updated successfully'
      }
      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async deleteProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      await problemService.deleteProblem(id)

      const response: ApiResponse = {
        success: true,
        message: 'Problem deleted successfully'
      }
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
}
