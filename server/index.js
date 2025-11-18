const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const praiseRoutes = require('./routes/praise');
const progressRoutes = require('./routes/progress');
const PraiseService = require('./services/PraiseService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Praise Service with Socket.IO
const praiseService = new PraiseService(io);

// Make praiseService available to routes
app.set('praiseService', praiseService);

// Routes
app.use('/api/praise', praiseRoutes);
app.use('/api/progress', progressRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    praiseEnabled: process.env.PRAISE_ENABLED === 'true'
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ Student connected: ${socket.id}`);

  socket.on('student-join', (data) => {
    const { studentId, moduleId } = data;
    socket.join(`student-${studentId}`);
    socket.join(`module-${moduleId}`);
    console.log(`📚 Student ${studentId} joined module ${moduleId}`);
  });

  socket.on('progress-update', async (data) => {
    const { studentId, moduleId, progressData } = data;

    // Check if praise should be triggered
    const praiseEvent = await praiseService.evaluateProgress(
      studentId,
      moduleId,
      progressData
    );

    if (praiseEvent) {
      // Send praise to specific student
      io.to(`student-${studentId}`).emit('voice-praise', praiseEvent);
      console.log(`🎉 Praise sent to student ${studentId}: ${praiseEvent.message}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Student disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🎓 LMS Voice Praise System                                ║
║  🌐 Server running on port ${PORT}                          ║
║  🔊 Praise enabled: ${process.env.PRAISE_ENABLED === 'true' ? 'YES' : 'NO'}                              ║
║  🗣️  TTS Provider: ${process.env.TTS_PROVIDER || 'web-speech-api'}               ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };
