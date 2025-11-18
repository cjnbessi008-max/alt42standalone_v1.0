import { Router } from 'express';
import * as shapesController from '../controllers/shapesController';
import * as problemsController from '../controllers/problemsController';

const router = Router();

// Shapes routes
router.get('/shapes', shapesController.getAllShapes);
router.get('/shapes/:id', shapesController.getShapeById);
router.post('/shapes', shapesController.createShape);
router.delete('/shapes/:id', shapesController.deleteShape);

// Problems routes
router.get('/problems', problemsController.getAllProblems);
router.get('/problems/:id', problemsController.getProblemById);
router.post('/problems', problemsController.createProblem);
router.post('/problems/analyze', problemsController.analyzeProblem);

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
