import { Router } from 'express';
import {
  submitProgress,
  getStudentProgress,
  getStudentStats,
  getProblemProgress,
} from '../controllers/progressController';

const router = Router();

router.post('/', submitProgress);
router.get('/student/:studentId', getStudentProgress);
router.get('/student/:studentId/stats', getStudentStats);
router.get('/problem/:problemId', getProblemProgress);

export default router;
