import express from 'express';
import {
  addCoordinate,
  addCoordinatesBatch,
  getCoordinates,
  getMeanCenter,
  recalculateMeanCenter,
  getSessionSummary
} from '../controllers/movementController.js';

const router = express.Router();

// POST /api/movement - Add single coordinate
router.post('/', addCoordinate);

// POST /api/movement/batch - Add multiple coordinates
router.post('/batch', addCoordinatesBatch);

// GET /api/movement/:sessionId - Get all coordinates for session
router.get('/:sessionId', getCoordinates);

// GET /api/movement/:sessionId/summary - Get session summary
router.get('/:sessionId/summary', getSessionSummary);

// GET /api/mean-center/:sessionId - Get mean center statistics
router.get('/mean-center/:sessionId', getMeanCenter);

// POST /api/mean-center/:sessionId/recalculate - Recalculate mean center
router.post('/mean-center/:sessionId/recalculate', recalculateMeanCenter);

export default router;
