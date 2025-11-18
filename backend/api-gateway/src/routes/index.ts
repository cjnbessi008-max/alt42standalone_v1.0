import { Express } from 'express';
import { sessionsRouter } from './sessions';
import { actionsRouter } from './actions';
import { stepsRouter } from './steps';
import { summariesRouter } from './summaries';
import { lmsRouter } from './lms';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
  message: 'Too many requests from this IP, please try again later.',
});

export function setupRoutes(app: Express): void {
  // Apply rate limiting
  app.use('/api', limiter);

  // API routes (all protected by authentication)
  app.use('/api/sessions', authenticate, sessionsRouter);
  app.use('/api/actions', authenticate, actionsRouter);
  app.use('/api/steps', authenticate, stepsRouter);
  app.use('/api/summaries', authenticate, summariesRouter);
  app.use('/api/lms', lmsRouter); // LMS has its own auth

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}
