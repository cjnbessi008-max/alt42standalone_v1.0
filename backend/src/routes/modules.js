import express from 'express';
import * as modulesController from '../controllers/modulesController.js';

const router = express.Router();

// Module CRUD operations
router.get('/', modulesController.getAllModules);
router.get('/:id', modulesController.getModuleById);
router.post('/', modulesController.createModule);
router.put('/:id', modulesController.updateModule);
router.delete('/:id', modulesController.deleteModule);

// Module generation
router.post('/:id/generate', modulesController.startGeneration);
router.get('/:id/status', modulesController.getGenerationStatus);

export default router;
