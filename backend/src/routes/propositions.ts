import { Router } from 'express';
import * as propositionController from '../controllers/propositionController';
import * as counterexampleController from '../controllers/counterexampleController';
// import { authenticate } from '../middleware/auth'; // Will be created later

const router = Router();

// Proposition routes
router.get('/', propositionController.getAllPropositions);
router.get('/search', propositionController.searchPropositions);
// router.get('/my', authenticate, propositionController.getMyPropositions);
router.get('/:id', propositionController.getPropositionById);
// router.post('/', authenticate, propositionController.createProposition);
// router.put('/:id', authenticate, propositionController.updateProposition);
// router.delete('/:id', authenticate, propositionController.deleteProposition);

// Temporary routes without auth for development
router.post('/', propositionController.createProposition);
router.put('/:id', propositionController.updateProposition);
router.delete('/:id', propositionController.deleteProposition);

// Counterexample routes
router.get('/:propositionId/counterexamples', counterexampleController.getCounterexamplesByProposition);
// router.post('/:propositionId/counterexamples', authenticate, counterexampleController.createCounterexample);
router.post('/:propositionId/counterexamples', counterexampleController.createCounterexample);

export default router;
