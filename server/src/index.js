/**
 * Chaos Harmony - Main Server
 * Standalone quiz application with learning pattern visualization
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Import database and routes
import { initializeDatabase } from './config/database.js';
import routes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// Middleware
// ============================================================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false
}));

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:8080', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// ============================================================================
// Initialize Database
// ============================================================================

try {
    initializeDatabase();
    console.log('✓ Database initialized');
} catch (error) {
    console.error('✗ Database initialization failed:', error);
    process.exit(1);
}

// ============================================================================
// Routes
// ============================================================================

// API routes
app.use('/api', routes);

// Serve static files from frontend (in production)
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../../frontend');
    app.use(express.static(frontendPath));

    // Serve index.html for all non-API routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'CORS error: Origin not allowed' });
    }

    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============================================================================
// Start Server
// ============================================================================

const server = app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║         🎨 Chaos Harmony Server Running              ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Port:        ${PORT}`);
    console.log(`  API:         http://localhost:${PORT}/api`);
    console.log(`  Health:      http://localhost:${PORT}/api/health`);
    console.log('');
    console.log('  Press Ctrl+C to stop');
    console.log('');
});

// ============================================================================
// Graceful Shutdown
// ============================================================================

const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

export default app;
