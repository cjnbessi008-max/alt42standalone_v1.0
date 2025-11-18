import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection, query } from './config/database.js';
import moodleClient from './moodle/client.js';
import routes from './api/routes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// =============================================
// Middleware
// =============================================
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// =============================================
// Routes
// =============================================
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    name: 'Counting Tree Map API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      problems: '/api/problems',
      moodle_launch: 'POST /api/moodle/launch',
      tree: '/api/tree/:problemId',
      session: '/api/session/:sessionId/progress'
    }
  });
});

// =============================================
// Socket.IO Real-time Communication
// =============================================

// Store active sessions
const activeSessions = new Map();

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Join session room
  socket.on('join-session', async (data) => {
    const { sessionId, userId } = data;
    socket.join(`session-${sessionId}`);
    activeSessions.set(socket.id, { sessionId, userId });

    console.log(`User ${userId} joined session ${sessionId}`);

    // Send current tree state
    try {
      const session = await query(
        'SELECT * FROM student_sessions WHERE id = ?',
        [sessionId]
      );

      if (session.length > 0) {
        const nodes = await query(
          'SELECT * FROM tree_nodes WHERE problem_id = ?',
          [session[0].problem_id]
        );

        socket.emit('tree-state', {
          problem_id: session[0].problem_id,
          nodes
        });
      }
    } catch (error) {
      console.error('Error loading session:', error);
      socket.emit('error', { message: 'Failed to load session' });
    }
  });

  // Handle student navigation through tree
  socket.on('navigate-node', async (data) => {
    const { sessionId, nodeId, sequenceOrder, studentInput } = data;

    try {
      // Record the path
      await query(
        `INSERT INTO student_paths (id, session_id, node_id, sequence_order, student_input)
         VALUES (UUID(), ?, ?, ?, ?)`,
        [sessionId, nodeId, sequenceOrder, JSON.stringify(studentInput || {})]
      );

      // Broadcast to session room
      io.to(`session-${sessionId}`).emit('node-visited', {
        nodeId,
        sequenceOrder,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error recording navigation:', error);
      socket.emit('error', { message: 'Failed to record navigation' });
    }
  });

  // Add new node to tree (teacher/admin feature)
  socket.on('add-node', async (data) => {
    const { problemId, parentId, nodeType, label, description, positionX, positionY } = data;

    try {
      const nodeId = `node-${Date.now()}`;
      await query(
        `INSERT INTO tree_nodes (id, problem_id, parent_id, node_type, label, description, position_x, position_y)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [nodeId, problemId, parentId || null, nodeType, label, description || '', positionX || 0, positionY || 0]
      );

      // Broadcast new node to all connected clients viewing this problem
      io.emit('node-added', {
        problemId,
        node: {
          id: nodeId,
          problem_id: problemId,
          parent_id: parentId,
          node_type: nodeType,
          label,
          description,
          position_x: positionX,
          position_y: positionY
        }
      });

    } catch (error) {
      console.error('Error adding node:', error);
      socket.emit('error', { message: 'Failed to add node' });
    }
  });

  // Update tree layout
  socket.on('update-node-position', async (data) => {
    const { nodeId, positionX, positionY } = data;

    try {
      await query(
        'UPDATE tree_nodes SET position_x = ?, position_y = ? WHERE id = ?',
        [positionX, positionY, nodeId]
      );

      socket.broadcast.emit('node-position-updated', {
        nodeId,
        positionX,
        positionY
      });

    } catch (error) {
      console.error('Error updating node position:', error);
    }
  });

  // Student submits answer
  socket.on('submit-answer', async (data) => {
    const { sessionId, nodeId, answer, isCorrect } = data;

    try {
      // Update student path
      await query(
        `UPDATE student_paths
         SET student_input = JSON_SET(student_input, '$.answer', ?, '$.is_correct', ?)
         WHERE session_id = ? AND node_id = ?`,
        [answer, isCorrect, sessionId, nodeId]
      );

      // Emit feedback
      io.to(`session-${sessionId}`).emit('answer-feedback', {
        nodeId,
        isCorrect,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error submitting answer:', error);
      socket.emit('error', { message: 'Failed to submit answer' });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const sessionInfo = activeSessions.get(socket.id);
    if (sessionInfo) {
      console.log(`User disconnected from session ${sessionInfo.sessionId}`);
      activeSessions.delete(socket.id);
    }
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// =============================================
// Error Handling
// =============================================
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// =============================================
// Server Startup
// =============================================
async function startServer() {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('⚠️  Database not connected. Some features may not work.');
    }

    // Test Moodle connection (optional)
    if (process.env.MOODLE_TOKEN && process.env.MOODLE_URL) {
      console.log('🔍 Testing Moodle connection...');
      await moodleClient.testConnection();
    } else {
      console.log('⚠️  Moodle credentials not configured. Skipping connection test.');
    }

    // Start server
    httpServer.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 Counting Tree Map Server Started');
      console.log('='.repeat(50));
      console.log(`📡 HTTP Server:   http://localhost:${PORT}`);
      console.log(`🔌 Socket.IO:     ws://localhost:${PORT}`);
      console.log(`🌍 Environment:   ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database:      MySQL 5.7`);
      console.log('='.repeat(50) + '\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

startServer();

export { app, io };
