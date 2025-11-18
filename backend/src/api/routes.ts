import { Router } from 'express';
import timelineController from './timeline.controller';
import lmsController from './lms.controller';

const router = Router();

// Timeline routes
router.post('/timeline/events', timelineController.recordEvent.bind(timelineController));
router.post('/timeline/events/batch', timelineController.recordEventsBatch.bind(timelineController));
router.get('/timeline/session/:sessionId', timelineController.getSessionTimeline.bind(timelineController));
router.get('/timeline/session/:sessionId/analytics', timelineController.getSessionAnalytics.bind(timelineController));
router.post('/timeline/query', timelineController.queryTimeline.bind(timelineController));
router.get('/timeline/student/:studentId/progress', timelineController.getStudentProgress.bind(timelineController));
router.get('/timeline/student/:studentId/sessions', timelineController.getStudentSessions.bind(timelineController));
router.get('/timeline/module/:moduleId/analytics', timelineController.getModuleAnalytics.bind(timelineController));

// LMS integration routes
router.get('/lms/student/:studentId/timeline', lmsController.getStudentTimeline.bind(lmsController));
router.get('/lms/module/:moduleId/analytics', lmsController.getModuleAnalytics.bind(lmsController));
router.get('/lms/xapi/statements', lmsController.getXAPIStatements.bind(lmsController));
router.post('/lms/export', lmsController.exportData.bind(lmsController));

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'alt42-lms-timeline-api'
  });
});

export default router;
