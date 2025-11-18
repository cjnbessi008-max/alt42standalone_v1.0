// Main application entry point

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { config } from './config/env.js';
import { initializeRedis } from './config/database.js';
import lengthAssistRoutes from './routes/lengthAssist.routes.js';
import moodleRoutes from './routes/moodle.routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();

const app: Express = express();
const PORT = config.port;

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ALT42 Length Assist API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/length-assist', lengthAssistRoutes);
app.use('/api/moodle', moodleRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Initialize Redis
    await initializeRedis();

    app.listen(PORT, () => {
      console.log('=================================');
      console.log(`🚀 ALT42 Length Assist API`);
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`📊 API Version: ${config.apiVersion}`);
      console.log('=================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
