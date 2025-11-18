/**
 * Problem management routes
 * Proxies to Python pipeline for problem generation and retrieval
 */

const express = require('express');
const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

const router = express.Router();

// Proxy to Python pipeline
const pipelineClient = axios.create({
  baseURL: config.pipelineUrl,
  timeout: 30000
});

/**
 * GET /api/v1/problems
 * List all problems with filters
 */
router.get('/', async (req, res, next) => {
  try {
    const { module_id, difficulty, function_type, limit, offset } = req.query;

    const response = await pipelineClient.get('/api/v1/problems', {
      params: { module_id, difficulty, function_type, limit, offset }
    });

    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching problems:', error.message);
    next(error);
  }
});

/**
 * GET /api/v1/problems/:id
 * Get a specific problem by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const response = await pipelineClient.get(`/api/v1/problems/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    logger.error(`Error fetching problem ${req.params.id}:`, error.message);
    next(error);
  }
});

/**
 * POST /api/v1/problems/generate
 * Generate a new problem using Claude AI
 */
router.post('/generate', async (req, res, next) => {
  try {
    const response = await pipelineClient.post('/api/v1/problems/generate', req.body);

    // Emit real-time event
    const io = req.app.get('io');
    io.emit('problem_generated', response.data);

    res.status(201).json(response.data);
  } catch (error) {
    logger.error('Error generating problem:', error.message);
    next(error);
  }
});

/**
 * POST /api/v1/problems/batch-generate
 * Generate multiple problems
 */
router.post('/batch-generate', async (req, res, next) => {
  try {
    const response = await pipelineClient.post('/api/v1/problems/batch-generate', req.body);
    res.status(201).json(response.data);
  } catch (error) {
    logger.error('Error in batch generation:', error.message);
    next(error);
  }
});

module.exports = router;
