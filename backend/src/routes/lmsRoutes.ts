/**
 * LMS Integration Routes
 */

import { Router } from 'express';
import lmsController from '../controllers/lmsController';

const router = Router();

/**
 * POST /api/lms/sync
 * Sync student progress with external LMS
 */
router.post('/sync', (req, res) => lmsController.syncWithLMS(req, res));

/**
 * POST /api/lms/export/:moduleId
 * Export grades to LMS for all students in a module
 */
router.post('/export/:moduleId', (req, res) => lmsController.exportGrades(req, res));

/**
 * POST /api/lms/import/:moduleId
 * Import student roster from LMS
 */
router.post('/import/:moduleId', (req, res) => lmsController.importRoster(req, res));

/**
 * GET /api/students/:studentId
 * Get student information
 */
router.get('/students/:studentId', (req, res) => lmsController.getStudent(req, res));

export default router;
