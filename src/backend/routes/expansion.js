const express = require('express');
const router = express.Router();

/**
 * Get expansion mode configuration
 * GET /api/expansion/config
 */
router.get('/config', (req, res) => {
  const config = {
    duration: parseInt(process.env.EXPANSION_DURATION) || 300000, // 5 minutes default
    startSize: parseInt(process.env.EXPANSION_START_SIZE) || 180, // pixels
    endSize: parseInt(process.env.EXPANSION_END_SIZE) || 400, // pixels
    expansionRate: 'progressive', // linear, exponential, progressive
    triggerType: 'time-based' // time-based, progress-based, hybrid
  };

  res.json({
    success: true,
    data: config
  });
});

/**
 * Calculate current expansion size based on progress
 * POST /api/expansion/calculate
 */
router.post('/calculate', (req, res) => {
  const { startTime, currentTime, progressPercentage, mode } = req.body;

  const config = {
    duration: parseInt(process.env.EXPANSION_DURATION) || 300000,
    startSize: parseInt(process.env.EXPANSION_START_SIZE) || 180,
    endSize: parseInt(process.env.EXPANSION_END_SIZE) || 400
  };

  let expansionFactor = 0;

  if (mode === 'time-based' && startTime && currentTime) {
    const elapsed = currentTime - startTime;
    expansionFactor = Math.min(elapsed / config.duration, 1);
  } else if (mode === 'progress-based' && typeof progressPercentage === 'number') {
    expansionFactor = Math.min(progressPercentage / 100, 1);
  } else if (mode === 'hybrid' && startTime && currentTime && typeof progressPercentage === 'number') {
    const timeElapsed = currentTime - startTime;
    const timeFactor = Math.min(timeElapsed / config.duration, 1);
    const progressFactor = Math.min(progressPercentage / 100, 1);
    expansionFactor = (timeFactor + progressFactor) / 2;
  }

  // Apply easing function for smooth expansion
  const easedFactor = easeInOutCubic(expansionFactor);

  const currentSize = config.startSize + (config.endSize - config.startSize) * easedFactor;

  res.json({
    success: true,
    data: {
      currentSize: Math.round(currentSize),
      expansionFactor: easedFactor,
      percentage: Math.round(easedFactor * 100),
      isFullyExpanded: easedFactor >= 1
    }
  });
});

/**
 * Get expansion mode statistics
 * GET /api/expansion/stats
 */
router.get('/stats', (req, res) => {
  // This would typically fetch from database
  // For now, return mock data
  res.json({
    success: true,
    data: {
      totalSessions: 0,
      averageExpansionTime: 0,
      completionRate: 0
    }
  });
});

/**
 * Easing function for smooth animation
 */
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

module.exports = router;
