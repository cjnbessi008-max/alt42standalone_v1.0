import { Request, Response } from 'express';
import { ProblemModel } from '../models/Problem';
import { ApiResponse } from '../types';

export const problemController = {
  // GET /api/v1/problems
  async getAll(req: Request, res: Response) {
    try {
      const { problem_type, difficulty_level, target_grade, is_active } =
        req.query;

      const filters: any = {};

      if (problem_type) filters.problem_type = problem_type as string;
      if (difficulty_level)
        filters.difficulty_level = difficulty_level as string;
      if (target_grade) filters.target_grade = parseInt(target_grade as string);
      if (is_active !== undefined)
        filters.is_active = is_active === 'true' || is_active === '1';

      const problems = await ProblemModel.getAll(filters);

      const response: ApiResponse = {
        success: true,
        data: problems,
        message: `Found ${problems.length} problems`,
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching problems:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch problems',
      };
      res.status(500).json(response);
    }
  },

  // GET /api/v1/problems/:id
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid problem ID',
        };
        return res.status(400).json(response);
      }

      const problem = await ProblemModel.getById(id);

      if (!problem) {
        const response: ApiResponse = {
          success: false,
          error: 'Problem not found',
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse = {
        success: true,
        data: problem,
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching problem:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch problem',
      };
      res.status(500).json(response);
    }
  },

  // GET /api/v1/problems/random
  async getRandom(req: Request, res: Response) {
    try {
      const { problem_type, difficulty_level, target_grade } = req.query;

      const filters: any = {};

      if (problem_type) filters.problem_type = problem_type as string;
      if (difficulty_level)
        filters.difficulty_level = difficulty_level as string;
      if (target_grade) filters.target_grade = parseInt(target_grade as string);

      const problem = await ProblemModel.getRandom(filters);

      if (!problem) {
        const response: ApiResponse = {
          success: false,
          error: 'No problems found matching criteria',
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse = {
        success: true,
        data: problem,
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching random problem:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch random problem',
      };
      res.status(500).json(response);
    }
  },

  // POST /api/v1/problems
  async create(req: Request, res: Response) {
    try {
      const problem = await ProblemModel.create(req.body);

      const response: ApiResponse = {
        success: true,
        data: problem,
        message: 'Problem created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating problem:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to create problem',
      };
      res.status(500).json(response);
    }
  },

  // PUT /api/v1/problems/:id
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid problem ID',
        };
        return res.status(400).json(response);
      }

      const problem = await ProblemModel.update(id, req.body);

      const response: ApiResponse = {
        success: true,
        data: problem,
        message: 'Problem updated successfully',
      };

      res.json(response);
    } catch (error) {
      console.error('Error updating problem:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update problem',
      };
      res.status(500).json(response);
    }
  },

  // DELETE /api/v1/problems/:id
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid problem ID',
        };
        return res.status(400).json(response);
      }

      const deleted = await ProblemModel.delete(id);

      if (!deleted) {
        const response: ApiResponse = {
          success: false,
          error: 'Problem not found',
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse = {
        success: true,
        message: 'Problem deleted successfully',
      };

      res.json(response);
    } catch (error) {
      console.error('Error deleting problem:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete problem',
      };
      res.status(500).json(response);
    }
  },
};
