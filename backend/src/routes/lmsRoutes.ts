import { Router } from 'express';
import lmsController from '../controllers/lmsController';

const router = Router();

// Create LMS integration
router.post('/integrations', lmsController.createIntegration);

// Get LMS integration by ID
router.get('/integrations/:id', lmsController.getIntegration);

// Get all active integrations
router.get('/integrations', lmsController.getActiveIntegrations);

// Sync students from LMS
router.post('/integrations/:id/sync', lmsController.syncStudents);

// Store OAuth tokens
router.post('/integrations/:id/tokens', lmsController.storeTokens);

export default router;
