const Sentry = require('@sentry/node');
const logger = require('../utils/logger');

// Only initialize Sentry in production with valid DSN
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
        // Performance monitoring
        integrations: [
            // Enable HTTP calls tracing
            new Sentry.Integrations.Http({ tracing: true }),
            // Enable Express.js integration
            new Sentry.Integrations.Express({ app: true })
        ]
    });

    logger.info('✅ Sentry Error Monitoring Initialized');
} else {
    logger.info('ℹ️  Sentry not initialized (production only)');
}

module.exports = Sentry;
