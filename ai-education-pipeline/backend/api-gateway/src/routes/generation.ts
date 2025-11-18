/**
 * Generation Pipeline Routes
 * Triggers and monitors AI pipeline execution
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import axios from 'axios';
import { db } from '../database';
import { ApiError } from '../middleware/errorHandler';

export const generationRouter = Router();

const PIPELINE_ENGINE_URL = process.env.PIPELINE_ENGINE_URL || 'http://localhost:8000';

/**
 * POST /api/generation/start
 * Start AI pipeline generation for a module
 */
generationRouter.post(
  '/start',
  [
    body('moduleId').isUUID(),
    body('teacherRequest').trim().notEmpty(),
    body('stage').optional().isIn(['world_model', 'rules', 'data', 'input_strategy', 'ui', 'deployment'])
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('Validation failed', 400);
    }

    const { moduleId, teacherRequest, stage = 'world_model' } = req.body;

    try {
      // Create generation job
      const jobResult = await db.query(
        `INSERT INTO generation_jobs (module_id, stage, status, input_data)
         VALUES ($1, $2, 'pending', $3)
         RETURNING *`,
        [moduleId, stage, JSON.stringify({ teacherRequest })]
      );

      const job = jobResult.rows[0];

      // Call pipeline engine
      const pipelineResponse = await axios.post(
        `${PIPELINE_ENGINE_URL}/api/generate`,
        {
          jobId: job.id,
          moduleId,
          teacherRequest,
          stage
        },
        { timeout: 60000 }
      );

      // Update job status
      await db.query(
        `UPDATE generation_jobs
         SET status = 'in_progress', started_at = NOW()
         WHERE id = $1`,
        [job.id]
      );

      res.status(202).json({
        success: true,
        job: {
          id: job.id,
          moduleId: job.module_id,
          stage: job.stage,
          status: 'in_progress',
          createdAt: job.created_at
        },
        message: 'Pipeline started successfully'
      });
    } catch (error) {
      throw error;
    }
  }
);

/**
 * GET /api/generation/status/:jobId
 * Get generation job status
 */
generationRouter.get('/status/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;

  try {
    const result = await db.query(
      'SELECT * FROM generation_jobs WHERE id = $1',
      [jobId]
    );

    if (result.rows.length === 0) {
      throw new ApiError('Job not found', 404);
    }

    const job = result.rows[0];

    res.json({
      success: true,
      job: {
        id: job.id,
        moduleId: job.module_id,
        stage: job.stage,
        status: job.status,
        inputData: job.input_data,
        outputData: job.output_data,
        errorLog: job.error_log,
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at
      }
    });
  } catch (error) {
    throw error;
  }
});

/**
 * GET /api/generation/jobs/:moduleId
 * Get all generation jobs for a module
 */
generationRouter.get('/jobs/:moduleId', async (req: Request, res: Response) => {
  const { moduleId } = req.params;

  try {
    const result = await db.query(
      `SELECT * FROM generation_jobs
       WHERE module_id = $1
       ORDER BY created_at DESC`,
      [moduleId]
    );

    res.json({
      success: true,
      jobs: result.rows.map(job => ({
        id: job.id,
        stage: job.stage,
        status: job.status,
        createdAt: job.created_at,
        completedAt: job.completed_at
      }))
    });
  } catch (error) {
    throw error;
  }
});
