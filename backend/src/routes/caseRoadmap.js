import express from 'express';
import * as caseRoadmapController from '../controllers/caseRoadmapController.js';

const router = express.Router();

// Case roadmap endpoints
router.get('/:moduleId', caseRoadmapController.getCaseRoadmap);
router.get('/:moduleId/pipeline', caseRoadmapController.getPipelineProgress);
router.post('/:moduleId/pipeline/:stage/complete', caseRoadmapController.completePipelineStage);
router.get('/active', caseRoadmapController.getAllActiveCases);

export default router;
