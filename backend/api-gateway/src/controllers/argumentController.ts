import { Response } from 'express';
import axios from 'axios';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { config } from '../config';

export const submitArgument = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { content, title, topic, subject, difficulty_level } = req.body;

  if (!content || content.trim().length === 0) {
    throw new AppError('Argument content is required', 400);
  }

  if (content.length < 50) {
    throw new AppError('Argument must be at least 50 characters long', 400);
  }

  // Create argument record
  const argumentResult = await query(
    `INSERT INTO arguments (user_id, title, content, topic, subject, difficulty_level, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, title, content, topic, subject || 'general', difficulty_level, 'pending']
  );

  const argument = argumentResult.rows[0];

  // Send to AI service for analysis (async)
  analyzeArgumentAsync(argument.id, content);

  res.status(201).json({
    success: true,
    message: 'Argument submitted successfully. Analysis in progress.',
    data: {
      argument_id: argument.id,
      status: argument.status,
      created_at: argument.created_at,
    },
  });
};

export const getArguments = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const status = req.query.status as string;
  const subject = req.query.subject as string;

  let queryText = `
    SELECT a.*,
           r.id as refutation_id,
           r.confidence_score,
           COUNT(fi.id) as fallacies_count
    FROM arguments a
    LEFT JOIN refutations r ON a.id = r.argument_id
    LEFT JOIN fallacy_instances fi ON r.id = fi.refutation_id
    WHERE a.user_id = $1
  `;
  const params: any[] = [userId];
  let paramIndex = 2;

  if (status) {
    queryText += ` AND a.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (subject) {
    queryText += ` AND a.subject = $${paramIndex}`;
    params.push(subject);
    paramIndex++;
  }

  queryText += `
    GROUP BY a.id, r.id
    ORDER BY a.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, offset);

  const result = await query(queryText, params);

  // Get total count
  const countResult = await query(
    'SELECT COUNT(*) FROM arguments WHERE user_id = $1',
    [userId]
  );
  const total = parseInt(countResult.rows[0].count);

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const getArgumentById = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  const result = await query(
    `SELECT a.*,
            r.id as refutation_id,
            r.analysis_summary,
            r.logical_structure,
            r.premise_analysis,
            r.conclusion_analysis,
            r.refutation_text,
            r.correct_reasoning,
            r.guided_questions,
            r.confidence_score,
            r.processing_time_ms,
            r.created_at as refutation_created_at
     FROM arguments a
     LEFT JOIN refutations r ON a.id = r.argument_id
     WHERE a.id = $1 AND a.user_id = $2`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Argument not found', 404);
  }

  const argument = result.rows[0];

  // Get fallacy instances if refutation exists
  if (argument.refutation_id) {
    const fallaciesResult = await query(
      `SELECT fi.*, f.name as fallacy_name, f.category, f.description
       FROM fallacy_instances fi
       JOIN fallacies f ON fi.fallacy_id = f.id
       WHERE fi.refutation_id = $1
       ORDER BY fi.severity DESC`,
      [argument.refutation_id]
    );

    argument.fallacies = fallaciesResult.rows;
  }

  res.json({
    success: true,
    data: argument,
  });
};

export const deleteArgument = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  const result = await query(
    'DELETE FROM arguments WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Argument not found or unauthorized', 404);
  }

  res.json({
    success: true,
    message: 'Argument deleted successfully',
  });
};

export const getArgumentStats = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  const statsResult = await query(
    `SELECT
      COUNT(DISTINCT a.id) as total_arguments,
      COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_arguments,
      COUNT(DISTINCT CASE WHEN a.status = 'pending' THEN a.id END) as pending_arguments,
      COUNT(DISTINCT fi.id) as total_fallacies,
      AVG(r.confidence_score) as avg_confidence_score
     FROM arguments a
     LEFT JOIN refutations r ON a.id = r.argument_id
     LEFT JOIN fallacy_instances fi ON r.id = fi.refutation_id
     WHERE a.user_id = $1`,
    [userId]
  );

  const subjectStatsResult = await query(
    `SELECT
      a.subject,
      COUNT(*) as count
     FROM arguments a
     WHERE a.user_id = $1
     GROUP BY a.subject
     ORDER BY count DESC`,
    [userId]
  );

  res.json({
    success: true,
    data: {
      overall: statsResult.rows[0],
      by_subject: subjectStatsResult.rows,
    },
  });
};

// Async function to analyze argument with AI service
async function analyzeArgumentAsync(argumentId: string, content: string) {
  try {
    // Update status to analyzing
    await query(
      'UPDATE arguments SET status = $1, analysis_started_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['analyzing', argumentId]
    );

    // Call AI service
    const response = await axios.post(
      `${config.aiService.url}/api/analyze`,
      { content, argument_id: argumentId },
      { timeout: config.aiService.timeout }
    );

    // Analysis completed successfully
    await query(
      'UPDATE arguments SET status = $1, analysis_completed_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['completed', argumentId]
    );

    console.log(`Analysis completed for argument ${argumentId}`);
  } catch (error) {
    console.error(`Analysis failed for argument ${argumentId}:`, error);

    // Update status to failed
    await query(
      'UPDATE arguments SET status = $1 WHERE id = $2',
      ['failed', argumentId]
    );
  }
}
