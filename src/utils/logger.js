const levels = ["info", "warn", "error"];
const winston = require('winston');

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const details = meta !== undefined ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${details}`;
};


const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.errors({ stack: true })
  ),
  transports: [
    // Write to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Write to file (optional)
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error' 
      }),
      new winston.transports.File({ 
        filename: 'logs/combined.log' 
      }),
    ] : []),
  ],
});

module.exports = { logger };
