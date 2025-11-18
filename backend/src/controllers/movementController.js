import Session from '../models/Session.js';
import Coordinate from '../models/Coordinate.js';
import MeanCenterStats from '../models/MeanCenterStats.js';

// Add a single coordinate
export const addCoordinate = async (req, res) => {
  try {
    const { sessionId, x, y } = req.body;

    // Validate input
    if (!sessionId || x === undefined || y === undefined) {
      return res.status(400).json({
        success: false,
        error: 'sessionId, x, and y are required'
      });
    }

    // Check if session exists
    const session = await Session.findBySessionId(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (!session.is_active) {
      return res.status(400).json({
        success: false,
        error: 'Session is not active'
      });
    }

    // Add coordinate
    const coordinate = await Coordinate.add(sessionId, x, y);

    // Calculate updated mean center
    const stats = await MeanCenterStats.calculate(sessionId);

    res.status(201).json({
      success: true,
      data: {
        coordinate,
        stats
      }
    });
  } catch (error) {
    console.error('Error adding coordinate:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add multiple coordinates (batch)
export const addCoordinatesBatch = async (req, res) => {
  try {
    const { sessionId, coordinates } = req.body;

    if (!sessionId || !Array.isArray(coordinates) || coordinates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and coordinates array are required'
      });
    }

    // Check session
    const session = await Session.findBySessionId(sessionId);
    if (!session || !session.is_active) {
      return res.status(404).json({
        success: false,
        error: 'Active session not found'
      });
    }

    // Add coordinates
    await Coordinate.addBatch(sessionId, coordinates);

    // Recalculate mean center
    const stats = await MeanCenterStats.calculate(sessionId);

    res.status(201).json({
      success: true,
      data: {
        addedCount: coordinates.length,
        stats
      }
    });
  } catch (error) {
    console.error('Error adding coordinates batch:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all coordinates for a session
export const getCoordinates = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit) || null;
    const offset = parseInt(req.query.offset) || 0;

    const coordinates = await Coordinate.findBySessionId(sessionId, limit, offset);
    const count = await Coordinate.count(sessionId);

    res.json({
      success: true,
      data: {
        coordinates,
        total: count,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get mean center statistics
export const getMeanCenter = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const stats = await MeanCenterStats.findBySessionId(sessionId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'No statistics found for this session'
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching mean center:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Recalculate mean center
export const recalculateMeanCenter = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findBySessionId(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const stats = await MeanCenterStats.calculate(sessionId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error recalculating mean center:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get session summary with coordinates and stats
export const getSessionSummary = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findBySessionId(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const stats = await MeanCenterStats.findBySessionId(sessionId);
    const recentCoordinates = await Coordinate.getRecent(sessionId, 100);
    const coordinateCount = await Coordinate.count(sessionId);

    res.json({
      success: true,
      data: {
        session,
        stats,
        recentCoordinates,
        coordinateCount
      }
    });
  } catch (error) {
    console.error('Error fetching session summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
