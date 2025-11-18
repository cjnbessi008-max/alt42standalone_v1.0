import { Router } from 'express';
import {
  getMoodleProblems,
  syncProgressToMoodle,
  getCourseInfo,
} from '../controllers/moodleController';

const router = Router();

router.get('/problems', getMoodleProblems);
router.post('/sync', syncProgressToMoodle);
router.get('/course/:courseId', getCourseInfo);

export default router;
