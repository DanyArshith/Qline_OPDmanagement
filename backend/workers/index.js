/**
 * Qline BullMQ Workers - Standalone Process Entrypoint
 * 
 * Run separately in production:
 *   node workers/index.js
 * 
 * Or via docker-compose:
 *   worker service runs this command
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Connect to DB (workers need it for job processing)
const connectDB = require('../config/db');
connectDB();

// Start all workers
require('./emailWorker');
require('./reminderWorker');
require('./analyticsWorker');
require('./notificationWorker');

logger.info('🏭 Qline BullMQ Workers started (standalone mode)');

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('Worker SIGTERM received, shutting down gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('Worker SIGINT received, shutting down gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});
