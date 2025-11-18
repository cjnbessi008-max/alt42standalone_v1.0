import { Request, Response } from 'express';
import { PropositionModel } from '../models/Proposition';
import { CounterexampleModel } from '../models/Counterexample';
import Joi from 'joi';

// Validation schemas
const createPropositionSchema = Joi.object({
  title: Joi.string().required().max(255),
  statement: Joi.string().required(),
  domain: Joi.string().required().max(100),
  type: Joi.string().valid('universal', 'existential', 'conditional', 'biconditional').required(),
  truthValue: Joi.boolean().optional(),
  visualConfig: Joi.object({
    mode: Joi.string().valid('venn', 'number-line', 'graph', 'custom').optional(),
    colors: Joi.object({
      positive: Joi.string().optional(),
      negative: Joi.string().optional(),
      neutral: Joi.string().optional(),
    }).optional(),
    animation: Joi.object({
      duration: Joi.number().optional(),
      easing: Joi.string().optional(),
    }).optional(),
  }).optional(),
});

const updatePropositionSchema = Joi.object({
  title: Joi.string().max(255).optional(),
  statement: Joi.string().optional(),
  domain: Joi.string().max(100).optional(),
  type: Joi.string().valid('universal', 'existential', 'conditional', 'biconditional').optional(),
  truthValue: Joi.boolean().optional(),
  visualConfig: Joi.object().optional(),
});

export const getAllPropositions = async (req: Request, res: Response) => {
  try {
    const propositions = await PropositionModel.findAll();
    res.json(propositions);
  } catch (error) {
    console.error('Error fetching propositions:', error);
    res.status(500).json({ error: 'Failed to fetch propositions' });
  }
};

export const getPropositionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const proposition = await PropositionModel.findById(id);

    if (!proposition) {
      return res.status(404).json({ error: 'Proposition not found' });
    }

    // Also fetch counterexamples
    const counterexamples = await CounterexampleModel.findByPropositionId(id);

    res.json({
      ...proposition,
      counterexamples,
    });
  } catch (error) {
    console.error('Error fetching proposition:', error);
    res.status(500).json({ error: 'Failed to fetch proposition' });
  }
};

export const createProposition = async (req: Request, res: Response) => {
  try {
    const { error, value } = createPropositionSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Get userId from authenticated user (set by auth middleware)
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const proposition = await PropositionModel.create(value, userId);
    res.status(201).json(proposition);
  } catch (error) {
    console.error('Error creating proposition:', error);
    res.status(500).json({ error: 'Failed to create proposition' });
  }
};

export const updateProposition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error, value } = updatePropositionSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const proposition = await PropositionModel.update(id, value);

    if (!proposition) {
      return res.status(404).json({ error: 'Proposition not found' });
    }

    res.json(proposition);
  } catch (error) {
    console.error('Error updating proposition:', error);
    res.status(500).json({ error: 'Failed to update proposition' });
  }
};

export const deleteProposition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await PropositionModel.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Proposition not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting proposition:', error);
    res.status(500).json({ error: 'Failed to delete proposition' });
  }
};

export const searchPropositions = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const propositions = await PropositionModel.search(q);
    res.json(propositions);
  } catch (error) {
    console.error('Error searching propositions:', error);
    res.status(500).json({ error: 'Failed to search propositions' });
  }
};

export const getMyPropositions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const propositions = await PropositionModel.findByCreator(userId);
    res.json(propositions);
  } catch (error) {
    console.error('Error fetching user propositions:', error);
    res.status(500).json({ error: 'Failed to fetch propositions' });
  }
};
