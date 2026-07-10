// src/utils/logger.js
const winston = require('winston');
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}
// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    trace: 5,
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
    trace: 'gray',
};

// Configure Winston
const logger = winston.createLogger({
    levels,
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss:ms',
        }),
        winston.format.errors({ stack: true }),
        winston.format.metadata(),
        winston.format.json()
    ),
    transports: [
        // Console transport
        new winston.transports.Console({
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
            format: winston.format.combine(
                winston.format.colorize({ all: true }),
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss',
                }),
                winston.format.printf(({ timestamp, level, message }) => {
                    return `${timestamp} ${level}: ${message}`;
                })
            ),
        }),
        // File transports for production
        ...(process.env.NODE_ENV === 'production'
            ? [
                new winston.transports.File({
                    filename: path.join(logDir, 'error.log'),
                    level: 'error',
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json()
                    ),
                }),
                new winston.transports.File({
                    filename: path.join(logDir, 'app.log'),
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json()
                    ),
                }),
            ]
            : []),
    ],
    exitOnError: false,
});

// Add colors to Winston
winston.addColors(colors);

// Create a stream for Morgan (HTTP logging)
const stream = {
    write: (message) => {
        logger.http(message.trim());
    },
};

// Helper functions for different log levels
const log = {
    error: (message, meta = {}) => {
        logger.error(message, meta);
    },
    warn: (message, meta = {}) => {
        logger.warn(message, meta);
    },
    info: (message, meta = {}) => {
        logger.info(message, meta);
    },
    http: (message, meta = {}) => {
        logger.http(message, meta);
    },
    debug: (message, meta = {}) => {
        logger.debug(message, meta);
    },
    trace: (message, meta = {}) => {
        logger.log('trace', message, meta);
    },
    // Log request details
    request: (req, meta = {}) => {
        logger.http(`${req.method} ${req.url}`, {
            ...meta,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            query: req.query,
            params: req.params,
        });
    },
    // Log response details
    response: (req, res, meta = {}) => {
        logger.info(`${req.method} ${req.url} - ${res.statusCode}`, {
            ...meta,
            duration: res.duration,
            contentLength: res.get('Content-Length'),
        });
    },
    // Log database operations
    db: (operation, collection, meta = {}) => {
        logger.debug(`DB ${operation} on ${collection}`, meta);
    },
    // Log cache operations
    cache: (operation, key, meta = {}) => {
        logger.debug(`Cache ${operation} for key: ${key}`, meta);
    },
};

// Create child logger with context
const createChild = (context) => {
    return logger.child({ context });
};

module.exports = {
    logger,
    log,
    stream,
    createChild,
    levels,
    colors,
};