import express from 'express';
import axios from 'axios';

const router = express.Router();

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:8000';

/**
 * Generate concept summary using AI
 * POST /api/concepts/generate-summary
 */
router.post('/generate-summary', async (req, res) => {
  try {
    const { concept_name, grade_level, concept_description, module_context, related_concepts } = req.body;

    if (!concept_name || !grade_level) {
      return res.status(400).json({
        error: 'concept_name and grade_level are required'
      });
    }

    // Forward request to Python orchestrator
    const response = await axios.post(
      `${ORCHESTRATOR_URL}/api/concepts/generate-summary`,
      {
        concept_name,
        grade_level,
        concept_description,
        module_context,
        related_concepts: related_concepts || []
      },
      {
        timeout: 30000 // 30 second timeout for AI generation
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error generating concept summary:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to generate concept summary'
    });
  }
});

/**
 * Generate summaries for multiple concepts
 * POST /api/concepts/generate-batch
 */
router.post('/generate-batch', async (req, res) => {
  try {
    const { concepts, grade_level, module_context } = req.body;

    if (!concepts || !Array.isArray(concepts) || concepts.length === 0) {
      return res.status(400).json({
        error: 'concepts array is required and must not be empty'
      });
    }

    if (!grade_level) {
      return res.status(400).json({
        error: 'grade_level is required'
      });
    }

    // Forward request to Python orchestrator
    const response = await axios.post(
      `${ORCHESTRATOR_URL}/api/concepts/generate-batch`,
      null,
      {
        params: {
          grade_level,
          module_context
        },
        data: concepts,
        timeout: 60000 // 60 second timeout for batch generation
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error generating batch summaries:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to generate batch summaries'
    });
  }
});

/**
 * Validate a concept summary
 * POST /api/concepts/validate-summary
 */
router.post('/validate-summary', async (req, res) => {
  try {
    const { concept_name, summary, grade_level } = req.body;

    if (!concept_name || !summary || !grade_level) {
      return res.status(400).json({
        error: 'concept_name, summary, and grade_level are required'
      });
    }

    // Forward request to Python orchestrator
    const response = await axios.post(
      `${ORCHESTRATOR_URL}/api/concepts/validate-summary`,
      null,
      {
        params: {
          concept_name,
          summary,
          grade_level
        },
        timeout: 20000
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error validating summary:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to validate summary'
    });
  }
});

/**
 * Regenerate concept summary with feedback
 * POST /api/concepts/regenerate-summary
 */
router.post('/regenerate-summary', async (req, res) => {
  try {
    const { concept_name, grade_level, feedback, previous_summary } = req.body;

    if (!concept_name || !grade_level) {
      return res.status(400).json({
        error: 'concept_name and grade_level are required'
      });
    }

    // Forward request to Python orchestrator
    const response = await axios.post(
      `${ORCHESTRATOR_URL}/api/concepts/regenerate-summary`,
      null,
      {
        params: {
          concept_name,
          grade_level,
          feedback,
          previous_summary
        },
        timeout: 30000
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error regenerating summary:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Failed to regenerate summary'
    });
  }
});

/**
 * Health check for concepts service
 * GET /api/concepts/health
 */
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${ORCHESTRATOR_URL}/api/concepts/health`, {
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;
