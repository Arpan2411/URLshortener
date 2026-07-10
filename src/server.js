const app = require('./app');
const { connectDB } = require('./config/db');
const { connectRedis } = require('./config/redis');
const { logger } = require('./utils/logger');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    try {
      await connectDB();
      logger.info('MongoDB connected successfully');
    } catch (error) {
      logger.warn('MongoDB not available at startup; continuing without it', error);
    }

    try {
      await connectRedis();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.warn('Redis not available at startup; continuing without it', error);
    }

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();