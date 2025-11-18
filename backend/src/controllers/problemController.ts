import { Request, Response } from 'express';
import { query } from '../config/database';
import {
  Problem,
  CorrespondencePair,
  ProblemWithPairs,
  ProblemStatistics,
} from '../types';

/**
 * Get all problems
 */
export async function getAllProblems(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const problems = await query<Problem[]>(
      'SELECT * FROM problems ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: problems,
      count: problems.length,
    });
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problems',
    });
  }
}

/**
 * Get problem by ID with correspondence pairs
 */
export async function getProblemById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const randomize = req.query.randomize === 'true';

    // Fetch problem
    const problems = await query<Problem[]>(
      'SELECT * FROM problems WHERE id = ?',
      [id]
    );

    if (problems.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Problem not found',
      });
      return;
    }

    const problem = problems[0];

    // Fetch correspondence pairs
    const pairs = await query<CorrespondencePair[]>(
      `SELECT * FROM correspondence_pairs
       WHERE problem_id = ? AND is_correct_match = TRUE
       ORDER BY display_order`,
      [id]
    );

    // Separate left and right items
    const leftItems = pairs.map((pair, index) => ({
      id: pair.left_item_id,
      text: pair.left_item_text,
      image_url: pair.left_item_image_url,
      order: randomize ? Math.random() : pair.display_order,
    }));

    const rightItems = pairs.map((pair, index) => ({
      id: pair.right_item_id,
      text: pair.right_item_text,
      image_url: pair.right_item_image_url,
      order: randomize ? Math.random() : pair.display_order,
    }));

    // Sort by order
    if (randomize) {
      leftItems.sort((a, b) => a.order - b.order);
      rightItems.sort((a, b) => a.order - b.order);
    }

    const problemWithPairs: ProblemWithPairs = {
      ...problem,
      left_items: leftItems,
      right_items: rightItems,
    };

    res.json({
      success: true,
      data: problemWithPairs,
    });
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problem',
    });
  }
}

/**
 * Get problem statistics
 */
export async function getProblemStatistics(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const stats = await query<ProblemStatistics[]>(
      'SELECT * FROM problem_statistics WHERE problem_id = ?',
      [id]
    );

    if (stats.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Statistics not found',
      });
      return;
    }

    res.json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
}

/**
 * Create new problem (for teachers)
 */
export async function createProblem(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {
      title,
      description,
      instructions,
      difficulty_level,
      time_limit_seconds,
      max_attempts,
      randomize_order,
      created_by,
      pairs,
    } = req.body;

    // Validate required fields
    if (!title || !pairs || pairs.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Title and at least one correspondence pair are required',
      });
      return;
    }

    const { v4: uuidv4 } = require('uuid');
    const problemId = uuidv4();

    // Insert problem
    await query(
      `INSERT INTO problems
       (id, title, description, instructions, difficulty_level, time_limit_seconds,
        max_attempts, randomize_order, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        problemId,
        title,
        description,
        instructions,
        difficulty_level || 1,
        time_limit_seconds || 300,
        max_attempts || 3,
        randomize_order || false,
        created_by,
      ]
    );

    // Insert correspondence pairs
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      const pairId = uuidv4();

      await query(
        `INSERT INTO correspondence_pairs
         (id, problem_id, left_item_id, left_item_text, left_item_image_url,
          right_item_id, right_item_text, right_item_image_url,
          is_correct_match, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pairId,
          problemId,
          pair.left_item_id,
          pair.left_item_text,
          pair.left_item_image_url,
          pair.right_item_id,
          pair.right_item_text,
          pair.right_item_image_url,
          true,
          i + 1,
        ]
      );
    }

    res.status(201).json({
      success: true,
      data: { id: problemId },
      message: 'Problem created successfully',
    });
  } catch (error) {
    console.error('Error creating problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create problem',
    });
  }
}
