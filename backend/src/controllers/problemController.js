import { Problem } from '../models/index.js';
import { logger } from '../config/logger.js';
import { Op } from 'sequelize';

// Get all problems with optional filters
export const getAllProblems = async (req, res) => {
  try {
    const {
      quantifierType,
      difficulty,
      isActive = true,
      page = 1,
      limit = 20
    } = req.query;

    const where = {};
    if (quantifierType) where.quantifierType = quantifierType;
    if (difficulty) where.difficulty = difficulty;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const offset = (page - 1) * limit;

    const { count, rows } = await Problem.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      problems: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching problems:', error);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
};

// Get a specific problem by ID
export const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await Problem.findByPk(id);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json(problem);
  } catch (error) {
    logger.error('Error fetching problem:', error);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
};

// Get a random problem
export const getRandomProblem = async (req, res) => {
  try {
    const { quantifierType, difficulty } = req.query;

    const where = { isActive: true };
    if (quantifierType) where.quantifierType = quantifierType;
    if (difficulty) where.difficulty = difficulty;

    const problem = await Problem.findOne({
      where,
      order: sequelize.random()
    });

    if (!problem) {
      return res.status(404).json({ error: 'No problems found matching criteria' });
    }

    res.json(problem);
  } catch (error) {
    logger.error('Error fetching random problem:', error);
    res.status(500).json({ error: 'Failed to fetch random problem' });
  }
};

// Create a new problem
export const createProblem = async (req, res) => {
  try {
    const problemData = req.body;

    const problem = await Problem.create(problemData);

    logger.info(`Problem created: ${problem.id}`);
    res.status(201).json(problem);
  } catch (error) {
    logger.error('Error creating problem:', error);
    res.status(500).json({ error: 'Failed to create problem' });
  }
};

// Update a problem
export const updateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const problem = await Problem.findByPk(id);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    await problem.update(updateData);

    logger.info(`Problem updated: ${problem.id}`);
    res.json(problem);
  } catch (error) {
    logger.error('Error updating problem:', error);
    res.status(500).json({ error: 'Failed to update problem' });
  }
};

// Delete a problem
export const deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await Problem.findByPk(id);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Soft delete - just mark as inactive
    await problem.update({ isActive: false });

    logger.info(`Problem deleted: ${problem.id}`);
    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    logger.error('Error deleting problem:', error);
    res.status(500).json({ error: 'Failed to delete problem' });
  }
};
