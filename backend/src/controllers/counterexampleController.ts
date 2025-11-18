import { Request, Response } from 'express';
import { CounterexampleModel } from '../models/Counterexample';
import { PropositionModel } from '../models/Proposition';
import Joi from 'joi';

const createCounterexampleSchema = Joi.object({
  value: Joi.any().required(),
  explanation: Joi.string().required(),
  visualPosition: Joi.object({
    x: Joi.number().required(),
    y: Joi.number().required(),
  }).optional(),
  shadowIntensity: Joi.number().min(0).max(1).optional(),
});

const updateCounterexampleSchema = Joi.object({
  value: Joi.any().optional(),
  explanation: Joi.string().optional(),
  visualPosition: Joi.object({
    x: Joi.number().required(),
    y: Joi.number().required(),
  }).optional(),
  shadowIntensity: Joi.number().min(0).max(1).optional(),
});

export const getCounterexamplesByProposition = async (req: Request, res: Response) => {
  try {
    const { propositionId } = req.params;

    // Verify proposition exists
    const proposition = await PropositionModel.findById(propositionId);
    if (!proposition) {
      return res.status(404).json({ error: 'Proposition not found' });
    }

    const counterexamples = await CounterexampleModel.findByPropositionId(propositionId);
    res.json(counterexamples);
  } catch (error) {
    console.error('Error fetching counterexamples:', error);
    res.status(500).json({ error: 'Failed to fetch counterexamples' });
  }
};

export const createCounterexample = async (req: Request, res: Response) => {
  try {
    const { propositionId } = req.params;
    const { error, value } = createCounterexampleSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Verify proposition exists
    const proposition = await PropositionModel.findById(propositionId);
    if (!proposition) {
      return res.status(404).json({ error: 'Proposition not found' });
    }

    const counterexample = await CounterexampleModel.create(propositionId, value);
    res.status(201).json(counterexample);
  } catch (error) {
    console.error('Error creating counterexample:', error);
    res.status(500).json({ error: 'Failed to create counterexample' });
  }
};

export const updateCounterexample = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error, value } = updateCounterexampleSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const counterexample = await CounterexampleModel.update(id, value);

    if (!counterexample) {
      return res.status(404).json({ error: 'Counterexample not found' });
    }

    res.json(counterexample);
  } catch (error) {
    console.error('Error updating counterexample:', error);
    res.status(500).json({ error: 'Failed to update counterexample' });
  }
};

export const deleteCounterexample = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await CounterexampleModel.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Counterexample not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting counterexample:', error);
    res.status(500).json({ error: 'Failed to delete counterexample' });
  }
};
