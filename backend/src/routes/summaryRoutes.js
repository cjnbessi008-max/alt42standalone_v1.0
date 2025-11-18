const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summaryController');

// Health check
router.get('/health', summaryController.healthCheck.bind(summaryController));

// 단일 문제 요약 (직접 텍스트 전달)
router.post('/summarize', summaryController.summarizeProblem.bind(summaryController));

// LMS 문제 ID로 요약
router.post('/summarize/lms', summaryController.summarizeLMSProblem.bind(summaryController));

// 배치 요약
router.post('/summarize/batch', summaryController.summarizeBatch.bind(summaryController));

// 모듈 전체 요약
router.post('/summarize/module', summaryController.summarizeModule.bind(summaryController));

module.exports = router;
