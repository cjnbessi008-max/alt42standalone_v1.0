import { Express, Router } from 'express'
import problemRoutes from './problemRoutes'
import attemptRoutes from './attemptRoutes'
import moodleRoutes from './moodleRoutes'

export function setupRoutes(app: Express): void {
  const apiRouter = Router()

  // API routes
  apiRouter.use('/problems', problemRoutes)
  apiRouter.use('/attempts', attemptRoutes)
  apiRouter.use('/moodle', moodleRoutes)

  // Mount API router
  app.use('/api', apiRouter)

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found'
    })
  })
}
