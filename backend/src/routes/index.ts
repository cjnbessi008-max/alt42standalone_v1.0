/**
 * API Routes Setup
 */

import { Express } from 'express';
import { metacognitionRoutes } from './metacognition.js';
import { activityRoutes } from './activity.js';
import { behaviorRoutes } from './behavior.js';
import { lmsRoutes } from './lms.js';

export function setupRoutes(app: Express): void {
  // API base path
  const apiPrefix = '/api/v1';

  // Mount routes
  app.use(`${apiPrefix}/metacognition`, metacognitionRoutes);
  app.use(`${apiPrefix}/activity`, activityRoutes);
  app.use(`${apiPrefix}/behavior`, behaviorRoutes);
  app.use(`${apiPrefix}/lms`, lmsRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found'
    });
  });
}
