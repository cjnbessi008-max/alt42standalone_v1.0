import { Router } from 'express';
import { problemController } from '../controllers/problemController.js';
import { attemptController } from '../controllers/attemptController.js';
import { ltiController } from '../controllers/ltiController.js';
import { validateLTILaunch } from '../middleware/lti.js';

const router = Router();

// LTI 라우트
router.post('/lti/launch', validateLTILaunch, ltiController.launch);
router.get('/lti/config.xml', ltiController.config);

// 문제 API
router.get('/api/problems', problemController.getAll);
router.get('/api/problems/:id', problemController.getById);
router.post('/api/problems', problemController.create);
router.put('/api/problems/:id', problemController.update);
router.delete('/api/problems/:id', problemController.delete);

// 시도 API
router.get('/api/attempts', attemptController.getAll);
router.get('/api/attempts/:id', attemptController.getById);
router.post('/api/attempts', attemptController.create);
router.get('/api/statistics', attemptController.getStatistics);

// 헬스 체크
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
