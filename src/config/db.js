// src/config/db.js
const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/urlshortner';
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    if (process.env.MONGO_USER && process.env.MONGO_PASSWORD) {
      options.auth = {
        username: process.env.MONGO_USER,
        password: process.env.MONGO_PASSWORD,
      };
    }

    if (process.env.MONGO_AUTH_SOURCE) {
      options.authSource = process.env.MONGO_AUTH_SOURCE;
    }

    await mongoose.connect(mongoURI, options);
    logger.info('MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    logger.warn('MongoDB connection error; continuing without it', error);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('MongoDB disconnection error:', error);
  }
};

module.exports = { connectDB, disconnectDB };