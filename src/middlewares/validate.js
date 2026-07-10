// src/middlewares/validate.js
const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/response');
const { logger } = require('../utils/logger');

/**
 * Validation middleware for Express
 * Validates request data against provided validation schema
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    logger.warn('Validation failed:', {
      errors: formattedErrors,
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Send error response
    return ApiResponse.validationError(res, formattedErrors, 'Validation failed');
  };
};

/**
 * Validate request body against schema
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      logger.warn('Body validation failed:', errors);
      return ApiResponse.validationError(res, errors, 'Invalid request body');
    }

    req.body = value;
    next();
  };
};

/**
 * Validate request query parameters
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      logger.warn('Query validation failed:', errors);
      return ApiResponse.validationError(res, errors, 'Invalid query parameters');
    }

    req.query = value;
    next();
  };
};

/**
 * Validate request parameters
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      logger.warn('Params validation failed:', errors);
      return ApiResponse.validationError(res, errors, 'Invalid parameters');
    }

    req.params = value;
    next();
  };
};

/**
 * Sanitize request input (prevent XSS, SQL injection, etc.)
 */
const sanitize = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Sanitize an object recursively
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Remove HTML tags, escape special characters
      sanitized[key] = value
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Validate that required fields are present
 */
const validateRequired = (fields, source = 'body') => {
  return (req, res, next) => {
    const missingFields = [];
    const data = req[source];

    for (const field of fields) {
      if (!data || data[field] === undefined || data[field] === null || data[field] === '') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return ApiResponse.badRequest(
        res,
        `Missing required fields: ${missingFields.join(', ')}`
      );
    }

    next();
  };
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
const validateUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Validate short code format
 */
const validateShortCode = (code) => {
  const codeRegex = /^[a-zA-Z0-9_-]+$/;
  return codeRegex.test(code) && code.length >= 3 && code.length <= 20;
};

/**
 * Validate date format
 */
const validateDate = (dateString) => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Validate phone number
 */
const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Create custom validation middleware
 */
const createValidator = (validationFn, errorMessage) => {
  return (req, res, next) => {
    const isValid = validationFn(req);
    if (!isValid) {
      return ApiResponse.badRequest(res, errorMessage);
    }
    next();
  };
};

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  sanitize,
  sanitizeObject,
  validateRequired,
  validateEmail,
  validateUrl,
  validateShortCode,
  validateDate,
  validatePhone,
  createValidator,
};