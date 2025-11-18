import { Router } from 'express';
import summaryController from '../controllers/summaryController';

const router = Router();

// Get daily summary for student
router.get('/student/:studentId', summaryController.getDailySummary);

// Get daily summaries for date range
router.get('/student/:studentId/range', summaryController.getDailySummaries);

// Generate daily summary for specific student and date
router.post('/student/:studentId/generate', summaryController.generateDailySummary);

// Generate summaries for all students (admin)
router.post('/generate-all', summaryController.generateAllSummaries);

// Trigger yesterday's summaries (manual trigger for cron job)
router.post('/trigger-yesterday', summaryController.triggerYesterdaySummaries);

export default router;
