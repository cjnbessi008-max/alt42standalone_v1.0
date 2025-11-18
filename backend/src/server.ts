import express, { Express } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import winston from 'winston';

// Import routes
import problemRoutes from './routes/problem.routes';
import interactionRoutes from './routes/interaction.routes';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Initialize Express app
const app: Express = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Initialize PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'wrongmove_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    logger.error('Database connection failed:', err);
  } else {
    logger.info('Database connected successfully at', res.rows[0].now);
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make pool and logger available to routes
app.locals.db = pool;
app.locals.logger = logger;
app.locals.io = io;

// Routes
app.use('/api/problems', problemRoutes);
app.use('/api/interactions', interactionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Handle problem request
  socket.on('problem:request', async (data) => {
    logger.info('Problem request received:', data);

    try {
      // Fetch problem from database or Moodle
      const result = await pool.query(
        'SELECT * FROM problems WHERE grade_level = $1 AND subject = $2 ORDER BY RANDOM() LIMIT 1',
        [data.gradeLevel, data.subject]
      );

      if (result.rows.length > 0) {
        socket.emit('problem:loaded', result.rows[0]);
      } else {
        // Return demo problem if none found
        socket.emit('problem:loaded', {
          id: 'demo_001',
          title: '분수의 덧셈',
          description: '다음 분수의 덧셈을 계산하세요: 1/2 + 1/4 = ?',
          type: 'step_by_step',
          correctAnswer: '3/4',
          steps: [
            {
              id: 'step_1',
              order: 1,
              description: '먼저 공통 분모를 찾으세요.',
              expectedAction: '4',
              validationRule: 'equals:4'
            }
          ],
          difficulty: 'easy',
          subject: '수학',
          gradeLevel: '초등 3학년'
        });
      }
    } catch (error) {
      logger.error('Error fetching problem:', error);
      socket.emit('error', { message: 'Failed to load problem' });
    }
  });

  // Handle student interaction
  socket.on('interaction:submit', async (interaction) => {
    logger.info('Interaction received:', interaction);

    try {
      // Save interaction to database
      await pool.query(
        'INSERT INTO student_interactions (id, problem_id, student_id, timestamp, action, is_correct, step_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          interaction.id,
          interaction.problemId,
          interaction.studentId,
          interaction.timestamp,
          interaction.action,
          interaction.isCorrect,
          interaction.stepId
        ]
      );

      // Send validation feedback
      socket.emit('problem:validation', {
        isCorrect: interaction.isCorrect,
        feedback: interaction.isCorrect
          ? '정답입니다! 👏'
          : '틀렸습니다. 다시 시도해보세요. 💪'
      });

      // If wrong answer, log wrong move event
      if (!interaction.isCorrect) {
        await pool.query(
          'INSERT INTO wrong_move_events (id, timestamp, problem_id, step_id, incorrect_action, expected_action, severity) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [
            `wrong_${Date.now()}`,
            new Date(),
            interaction.problemId,
            interaction.stepId,
            interaction.action,
            'N/A', // Should be fetched from problem definition
            'high'
          ]
        );
      }
    } catch (error) {
      logger.error('Error saving interaction:', error);
      socket.emit('error', { message: 'Failed to save interaction' });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  logger.info(`📊 Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    pool.end(() => {
      logger.info('Database pool closed');
      process.exit(0);
    });
  });
});

export { app, io, pool, logger };
