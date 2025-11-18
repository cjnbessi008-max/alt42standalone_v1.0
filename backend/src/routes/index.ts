import { Router } from 'express';
import { CheckpointController } from '../controllers/checkpointController';
import { ProblemController } from '../controllers/problemController';
import { LMSController } from '../controllers/lmsController';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Problem routes
router.get('/problems', ProblemController.getAllProblems);
router.get('/problems/:id', ProblemController.getProblem);

// Submission routes
router.post('/submissions', CheckpointController.createSubmission);
router.get('/submissions/:id', CheckpointController.getSubmission);
router.get('/students/:studentId/submissions', CheckpointController.getStudentSubmissions);

// Checkpoint validation routes
router.post('/checkpoint/validate', CheckpointController.validateCheckpoint);

// LMS integration routes
router.post('/lms/submit', LMSController.submitToLMS);
router.get('/lms/sync/:submissionId', LMSController.getSyncStatus);
router.post('/lms/sync/:syncId/retry', LMSController.retrySync);

export default router;
