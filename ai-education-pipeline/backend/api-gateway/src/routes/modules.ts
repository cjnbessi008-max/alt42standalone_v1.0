/**
 * Module Management Routes
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../database';
import { ApiError } from '../middleware/errorHandler';

export const moduleRouter = Router();

/**
 * POST /api/modules
 * Create a new module (teacher request)
 */
moduleRouter.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('subject').isIn(['mathematics', 'science', 'language']),
    body('gradeLevel').isInt({ min: 1, max: 12 })
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('Validation failed', 400);
    }

    const { name, description, subject, gradeLevel } = req.body;
    const teacherId = (req as any).user?.id || 1; // TODO: Get from auth

    try {
      const result = await db.query(
        `INSERT INTO modules (name, description, subject, grade_level, teacher_id, status)
         VALUES ($1, $2, $3, $4, $5, 'generating')
         RETURNING *`,
        [name, description, subject, gradeLevel, teacherId]
      );

      const module = result.rows[0];

      res.status(201).json({
        success: true,
        module: {
          id: module.id,
          name: module.name,
          description: module.description,
          subject: module.subject,
          gradeLevel: module.grade_level,
          status: module.status,
          createdAt: module.created_at
        }
      });
    } catch (error) {
      throw error;
    }
  }
);

/**
 * GET /api/modules
 * Get all modules for current teacher
 */
moduleRouter.get('/', async (req: Request, res: Response) => {
  const teacherId = (req as any).user?.id || 1; // TODO: Get from auth

  try {
    const result = await db.query(
      `SELECT id, name, description, subject, grade_level, status, version, created_at, updated_at
       FROM modules
       WHERE teacher_id = $1
       ORDER BY created_at DESC`,
      [teacherId]
    );

    res.json({
      success: true,
      modules: result.rows.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        subject: m.subject,
        gradeLevel: m.grade_level,
        status: m.status,
        version: m.version,
        createdAt: m.created_at,
        updatedAt: m.updated_at
      }))
    });
  } catch (error) {
    throw error;
  }
});

/**
 * GET /api/modules/:id
 * Get a specific module by ID
 */
moduleRouter.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'SELECT * FROM modules WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new ApiError('Module not found', 404);
    }

    const module = result.rows[0];

    res.json({
      success: true,
      module: {
        id: module.id,
        name: module.name,
        description: module.description,
        subject: module.subject,
        gradeLevel: module.grade_level,
        status: module.status,
        worldModel: module.world_model,
        generatedSchema: module.generated_schema,
        generatedUi: module.generated_ui,
        version: module.version,
        createdAt: module.created_at,
        updatedAt: module.updated_at
      }
    });
  } catch (error) {
    throw error;
  }
});

/**
 * DELETE /api/modules/:id
 * Delete a module
 */
moduleRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM modules WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new ApiError('Module not found', 404);
    }

    res.json({
      success: true,
      message: 'Module deleted successfully'
    });
  } catch (error) {
    throw error;
  }
});
