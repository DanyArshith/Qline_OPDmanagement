require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

// Phase 4: Infrastructure imports
const logger = require('./utils/logger');
const Sentry = require('./config/sentry');
const redisClient = require('./config/redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const { apiLimiter, strictLimiter } = require('./middleware/rateLimiter');

// Config and middleware
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const socketAuth = require('./middleware/socketAuth');
const setupSocket = require('./sockets/queueSocket');
const { verifyAndInitializeData } = require('./utils/dataPersistenceCheck');


// Import routes
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctor');
const appointmentRoutes = require('./routes/appointment');
const queueRoutes = require('./routes/queue');

// Phase 4: New routes
const notificationRoutes = require('./routes/notification');
const medicalRecordRoutes = require('./routes/medicalRecord');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');
const settingsRoutes = require('./routes/settings');
const patientRoutes = require('./routes/patient');
const supportRoutes = require('./routes/support');
const errorRoutes = require('./routes/error');


// Initialize Express
const app = express();
const server = http.createServer(app);

// Phase 4: Sentry request handler (must be first)
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.requestHandler());
}

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Phase 4: Setup Redis adapter for Socket.IO horizontal scaling
const setupRedisAdapter = async () => {
    // Only setup if Redis is available
    if (!redisClient) {
        logger.info('ℹ️  Socket.IO running without Redis adapter (single server mode)');
        return;
    }

    try {
        const pubClient = redisClient.duplicate();
        const subClient = redisClient.duplicate();

        io.adapter(createAdapter(pubClient, subClient));
        logger.info('✅ Socket.IO Redis adapter initialized');
    } catch (error) {
        logger.error('Failed to setup Redis adapter:', error.message);
        logger.warn('⚠️  Socket.IO running without Redis adapter (single server mode)');
    }
};

setupRedisAdapter();

// Socket.IO Authentication Middleware
io.use(socketAuth);

// Expose io globally so workers running in the same process can emit events
// (in multi-process/Docker mode, Socket.IO Redis adapter handles cross-process emit)
global.io = io;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json()); // Body parser
app.use(express.urlencoded({ extended: true }));

// Phase 4: Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Make io accessible in routes
app.set('io', io);

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Qline API - OPD Queue Management System',
        version: '1.0.0',
        status: 'running',
        availableEndpoints: {
            health: '/health',
            auth: '/api/auth',
            doctors: '/api/doctors',
            appointments: '/api/appointments',
            queue: '/api/queue',
            notifications: '/api/notifications',
            medicalRecords: '/api/medical-records',
            analytics: '/api/analytics',
            admin: '/api/admin',
            profile: '/api/profile',
            settings: '/api/settings',
            patient: '/api/patient',
            support: '/api/support',
            errors: '/api/errors'
        }
    });
});

// Routes
app.use('/api/auth', strictLimiter, authRoutes); // Strict rate limiting on auth
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);

// Phase 4: New routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/errors', errorRoutes);


// Phase 4: Enhanced health check route
app.get('/health', async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            mongodb: 'checking',
            redis: 'checking'
        }
    };

    // Check MongoDB
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.db.admin().ping();
            health.services.mongodb = 'connected';
        } else {
            health.services.mongodb = 'disconnected';
            health.status = 'degraded';
        }
    } catch (error) {
        health.services.mongodb = 'error';
        health.status = 'degraded';
        logger.error('MongoDB health check failed:', error);
    }

    // Check Redis
    if (redisClient) {
        try {
            await redisClient.ping();
            health.services.redis = 'connected';
        } catch (error) {
            health.services.redis = 'disconnected';
            health.status = 'degraded';
            logger.error('Redis health check failed:', error);
        }
    } else {
        health.services.redis = 'not_configured';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
});

// 404 handler
app.use((req, res, next) => {
    res.status(404);
    next(new Error(`Route not found: ${req.originalUrl}`));
});

// Phase 4: Sentry error handler (after routes, before custom error handler)
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
}

// Error handler (must be last)
app.use(errorHandler);

// Setup Socket.IO
setupSocket(io);

// Phase 5: BullMQ & Scheduled Tasks
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const emailQueue = require('./queues/emailQueue');
const reminderQueue = require('./queues/reminderQueue');
const analyticsQueue = require('./queues/analyticsQueue');
const notificationQueue = require('./queues/notificationQueue');
const analyticsService = require('./services/analyticsService');

// Initialize Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
    queues: [
        new BullMQAdapter(emailQueue),
        new BullMQAdapter(reminderQueue),
        new BullMQAdapter(analyticsQueue),
        new BullMQAdapter(notificationQueue)
    ],
    serverAdapter
});

// Mount Bull Board (Admin only)
const authMiddleware = require('./middleware/auth');
const roleCheck = require('./middleware/roleCheck');
const ipWhitelist = require('./middleware/ipWhitelist');

// Parse allowed IPs from env
const allowedAdminIps = process.env.ADMIN_IP_WHITELIST ?
    process.env.ADMIN_IP_WHITELIST.split(',') : [];

app.use(
    '/admin/queues',
    authMiddleware.verifyToken,
    roleCheck.requireRole(['admin']),
    // Only enforce IP whitelist if configured
    (req, res, next) => {
        if (allowedAdminIps.length > 0) {
            return ipWhitelist(allowedAdminIps)(req, res, next);
        }
        next();
    },
    serverAdapter.getRouter()
);

// Schedule recurring jobs
const scheduleSystemJobs = async () => {
    try {
        // Schedule daily analytics
        await analyticsService.scheduleDailyAnalytics();
        logger.info('📅 valid system jobs scheduled');
    } catch (err) {
        logger.error('Failed to schedule system jobs:', err);
    }
};

// Start workers (in this process for now, ideally separate)
// In production, run: node workers/index.js
require('./workers/emailWorker');
require('./workers/reminderWorker');
require('./workers/analyticsWorker');
require('./workers/notificationWorker');

const { warmCache } = require('./utils/cacheWarmer');
const { ensureIndexes } = require('./utils/dbOptimizer');

scheduleSystemJobs();
// Initialize indexes + cache warmer concurrently (non-blocking)
Promise.all([
    warmCache(),
    ensureIndexes()
]).then(() => {
    logger.info('✨ System ready (indexes ensured, cache warmed)');
}).catch(err => {
    logger.error('Startup tasks failed (non-fatal):', err.message);
});

logger.info('🚀 BullMQ workers started');

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`⏰ Cron jobs initialized`);
    
    // Verify data persistence
    await verifyAndInitializeData();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
        logger.info('HTTP server closed');
        await mongoose.connection.close();
        if (redisClient) {
            await redisClient.quit();
        }
        process.exit(0);
    });
});

module.exports = { app, server, io };
