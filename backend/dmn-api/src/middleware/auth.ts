import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger();

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    logger.error('API_KEY not configured in environment');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  if (!apiKey) {
    logger.warn('API request without API key', { ip: req.ip, path: req.path });
    res.status(401).json({ error: 'API key required' });
    return;
  }

  if (apiKey !== validApiKey) {
    logger.warn('Invalid API key attempt', { ip: req.ip, path: req.path });
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  next();
}
