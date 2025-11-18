import { Request, Response } from 'express';
import { ProblemModel } from '../models/Problem.js';

export const problemController = {
  // 모든 문제 조회
  async getAll(req: Request, res: Response) {
    try {
      const problems = await ProblemModel.findAll();
      res.json(problems);
    } catch (error) {
      console.error('Error fetching problems:', error);
      res.status(500).json({ error: 'Failed to fetch problems' });
    }
  },

  // 특정 문제 조회
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid problem ID' });
      }

      const problem = await ProblemModel.findById(id);

      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }

      res.json(problem);
    } catch (error) {
      console.error('Error fetching problem:', error);
      res.status(500).json({ error: 'Failed to fetch problem' });
    }
  },

  // 문제 생성
  async create(req: Request, res: Response) {
    try {
      const problem = await ProblemModel.create(req.body);
      res.status(201).json(problem);
    } catch (error) {
      console.error('Error creating problem:', error);
      res.status(500).json({ error: 'Failed to create problem' });
    }
  },

  // 문제 업데이트
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid problem ID' });
      }

      const problem = await ProblemModel.update(id, req.body);

      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }

      res.json(problem);
    } catch (error) {
      console.error('Error updating problem:', error);
      res.status(500).json({ error: 'Failed to update problem' });
    }
  },

  // 문제 삭제
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid problem ID' });
      }

      const deleted = await ProblemModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ error: 'Problem not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting problem:', error);
      res.status(500).json({ error: 'Failed to delete problem' });
    }
  },
};
