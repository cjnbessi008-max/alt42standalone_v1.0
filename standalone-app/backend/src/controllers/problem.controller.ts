import { Response } from 'express';
import { query, queryOne } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

/**
 * Get all problems (with filters)
 */
export const getProblems = async (req: AuthRequest, res: Response) => {
  const {
    difficulty,
    tags,
    search,
    limit = 20,
    offset = 0,
  } = req.query;

  let sql = `
    SELECT
      p.*,
      COUNT(DISTINCT a.user_id) as attempt_count,
      AVG(a.score) as average_score
    FROM problems p
    LEFT JOIN attempts a ON p.id = a.problem_id
    WHERE p.is_active = 1
  `;

  const params: any[] = [];

  if (difficulty) {
    sql += ' AND p.difficulty = ?';
    params.push(difficulty);
  }

  if (tags) {
    sql += ' AND p.tags LIKE ?';
    params.push(`%${tags}%`);
  }

  if (search) {
    sql += ' AND (p.title LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ' GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const problems = await query(sql, params);

  res.json({
    problems,
    pagination: {
      limit: Number(limit),
      offset: Number(offset),
    },
  });
};

/**
 * Get single problem by ID
 */
export const getProblem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const problem = await queryOne(
    'SELECT * FROM problems WHERE id = ? AND is_active = 1',
    [id]
  );

  if (!problem) {
    throw new AppError('Problem not found', 404);
  }

  res.json(problem);
};

/**
 * Create new problem (teacher/admin only)
 */
export const createProblem = async (req: AuthRequest, res: Response) => {
  const {
    title,
    description,
    shape_type,
    shape_data,
    difficulty = 'medium',
    tags,
    correct_answer,
    hints,
    time_limit,
    max_attempts,
    is_public = false,
  } = req.body;

  if (!title || !shape_data) {
    throw new AppError('Title and shape_data are required', 400);
  }

  const result: any = await query(
    `INSERT INTO problems (
      created_by,
      title,
      description,
      shape_type,
      shape_data,
      difficulty,
      tags,
      correct_answer,
      hints,
      time_limit,
      max_attempts,
      is_public
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user?.id,
      title,
      description,
      shape_type,
      JSON.stringify(shape_data),
      difficulty,
      tags,
      JSON.stringify(correct_answer),
      JSON.stringify(hints),
      time_limit,
      max_attempts,
      is_public ? 1 : 0,
    ]
  );

  res.status(201).json({
    message: 'Problem created successfully',
    problemId: result.insertId,
  });
};

/**
 * Update problem (teacher/admin only)
 */
export const updateProblem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  // Check if problem exists and user owns it
  const problem: any = await queryOne(
    'SELECT created_by FROM problems WHERE id = ?',
    [id]
  );

  if (!problem) {
    throw new AppError('Problem not found', 404);
  }

  if (problem.created_by !== req.user?.id && req.user?.role !== 'admin') {
    throw new AppError('You can only edit your own problems', 403);
  }

  // Build update query dynamically
  const allowedFields = [
    'title',
    'description',
    'shape_type',
    'shape_data',
    'difficulty',
    'tags',
    'correct_answer',
    'hints',
    'time_limit',
    'max_attempts',
    'is_public',
  ];

  const updateFields: string[] = [];
  const updateValues: any[] = [];

  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key)) {
      updateFields.push(`${key} = ?`);
      let value = updates[key];

      // Stringify JSON fields
      if (['shape_data', 'correct_answer', 'hints'].includes(key) && typeof value === 'object') {
        value = JSON.stringify(value);
      }

      updateValues.push(value);
    }
  });

  if (updateFields.length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  updateValues.push(id);

  await query(
    `UPDATE problems SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  res.json({ message: 'Problem updated successfully' });
};

/**
 * Delete problem (soft delete)
 */
export const deleteProblem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Check ownership
  const problem: any = await queryOne(
    'SELECT created_by FROM problems WHERE id = ?',
    [id]
  );

  if (!problem) {
    throw new AppError('Problem not found', 404);
  }

  if (problem.created_by !== req.user?.id && req.user?.role !== 'admin') {
    throw new AppError('You can only delete your own problems', 403);
  }

  // Soft delete
  await query('UPDATE problems SET is_active = 0 WHERE id = ?', [id]);

  res.json({ message: 'Problem deleted successfully' });
};
