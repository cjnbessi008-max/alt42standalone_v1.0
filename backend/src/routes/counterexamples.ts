import { Router } from 'express';
import * as counterexampleController from '../controllers/counterexampleController';
// import { authenticate } from '../middleware/auth';

const router = Router();

// router.put('/:id', authenticate, counterexampleController.updateCounterexample);
// router.delete('/:id', authenticate, counterexampleController.deleteCounterexample);

// Temporary routes without auth for development
router.put('/:id', counterexampleController.updateCounterexample);
router.delete('/:id', counterexampleController.deleteCounterexample);

export default router;
