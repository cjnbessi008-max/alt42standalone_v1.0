import { Router } from 'express';
import ConceptPairController from '../controllers/ConceptPairController';

const router = Router();

// Concept Pair routes
router.get('/concept-pairs', ConceptPairController.getAllConceptPairs.bind(ConceptPairController));
router.get('/concept-pairs/:id', ConceptPairController.getConceptPairById.bind(ConceptPairController));
router.post('/concept-pairs', ConceptPairController.createConceptPair.bind(ConceptPairController));
router.get('/concept-pairs/:id/statistics', ConceptPairController.getStatistics.bind(ConceptPairController));

// Warning routes
router.post('/warnings/check', ConceptPairController.checkWarnings.bind(ConceptPairController));
router.post('/warnings/:id/acknowledge', ConceptPairController.acknowledgeWarning.bind(ConceptPairController));
router.post('/warnings/:id/effectiveness', ConceptPairController.updateEffectiveness.bind(ConceptPairController));

export default router;
