const express = require('express');
const logHeatController = require('../controllers/logHeatController');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Log Heat API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Heat 관련 엔드포인트
router.get('/heat', logHeatController.getHeat.bind(logHeatController));
router.get('/heat/all', logHeatController.getAllTimeWindows.bind(logHeatController));
router.get('/heat/heatmap', logHeatController.getHeatmap.bind(logHeatController));
router.get('/heat/ranking', logHeatController.getRanking.bind(logHeatController));

// 로그 통계
router.get('/logs/stats', logHeatController.getLogStats.bind(logHeatController));

// Moodle 연동
router.post('/sync', logHeatController.syncFromMoodle.bind(logHeatController));
router.get('/moodle/test', logHeatController.testMoodleConnection.bind(logHeatController));

module.exports = router;
