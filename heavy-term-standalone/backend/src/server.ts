/**
 * Heavy Term Backend Server
 * Express + TypeScript + Prisma
 */

import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import compression from 'compression'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Import routes
import problemRoutes from './routes/problems.js'
import sessionRoutes from './routes/sessions.js'
import interactionRoutes from './routes/interactions.js'
import settingRoutes from './routes/settings.js'

// Load environment variables
dotenv.config()

const app: Express = express()
const PORT = process.env.PORT || 3000

// Initialize Prisma Client
export const prisma = new PrismaClient()

// Middleware
app.use(helmet()) // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(compression()) // Compress responses
app.use(express.json()) // Parse JSON bodies
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev')) // Logging

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// API Routes
app.use('/api/problems', problemRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/interactions', interactionRoutes)
app.use('/api/settings', settingRoutes)

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Heavy Term API',
    version: '1.0.0',
    description: 'Gravity-based math learning application',
    endpoints: {
      health: '/health',
      problems: '/api/problems',
      sessions: '/api/sessions',
      interactions: '/api/interactions',
      settings: '/api/settings',
    },
  })
})

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  })
})

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err)

  const statusCode = (err as any).statusCode || 500

  res.status(statusCode).json({
    success: false,
    error: err.name,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server')
  await prisma.$disconnect()
  process.exit(0)
})

// Start server
async function startServer() {
  try {
    // Connect to database
    await prisma.$connect()
    console.log('✅ Database connected')

    // Initialize default settings if needed
    await initializeDefaultSettings()

    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Heavy Term API server running on port ${PORT}`)
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Initialize default settings
async function initializeDefaultSettings() {
  const defaultSettings = [
    { key: 'gravity_strength', value: '9.8', type: 'number', description: 'Base gravity acceleration' },
    { key: 'gravity_multiplier', value: '2.0', type: 'number', description: 'Term size gravity multiplier' },
    { key: 'bounce_damping', value: '0.7', type: 'number', description: 'Energy loss on collision' },
    { key: 'friction_coefficient', value: '0.98', type: 'number', description: 'Friction factor' },
    { key: 'max_velocity', value: '500', type: 'number', description: 'Maximum term velocity' },
    { key: 'enable_gravity', value: 'true', type: 'boolean', description: 'Enable gravity effect' },
    { key: 'enable_collisions', value: 'true', type: 'boolean', description: 'Enable collision detection' },
  ]

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log('✅ Default settings initialized')
}

// Start the server
startServer()
