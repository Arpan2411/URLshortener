// src/validators/url.validator.js
const Joi = require('joi');

const urlValidator = {
  // Create short URL validation
  createUrl: Joi.object({
    originalUrl: Joi.string()
      .required()
      .uri({
        scheme: ['http', 'https']
      })
      .max(2048)
      .messages({
        'string.uri': 'Invalid URL format. Must be a valid HTTP/HTTPS URL',
        'string.empty': 'Original URL is required',
        'any.required': 'Original URL is required',
        'string.max': 'URL is too long (max 2048 characters)',
      }),

    customCode: Joi.string()
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .min(3)
      .max(20)
      .optional()
      .messages({
        'string.pattern.base':
          'Custom code may contain only letters, numbers, "_" and "-"',
        'string.min':
          'Custom code must be at least 3 characters',
        'string.max':
          'Custom code cannot exceed 20 characters',
      }),
    expiresAt: Joi.date()
      .greater('now')
      .optional()
      .messages({
        'date.greater': 'Expiration date must be in the future',
      }),
  }),

  // Get original URL validation
  getUrl: Joi.object({
    shortCode: Joi.string()
      .required()
      .length(7)
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .messages({
        'string.length': 'Short code must be exactly 7 characters',
        'string.pattern.base': 'Short code contains invalid characters',
        'string.empty': 'Short code is required',
        'any.required': 'Short code is required',
      }),
  }),

  // Get URL stats validation
  getStats: Joi.object({
    shortCode: Joi.string()
      .required()
      .length(7)
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .messages({
        'string.length': 'Short code must be exactly 7 characters',
        'string.pattern.base': 'Short code contains invalid characters',
        'string.empty': 'Short code is required',
        'any.required': 'Short code is required',
      }),
  }),

  // Delete URL validation
  deleteUrl: Joi.object({
    shortCode: Joi.string()
      .required()
      .length(7)
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .messages({
        'string.length': 'Short code must be exactly 7 characters',
        'string.pattern.base': 'Short code contains invalid characters',
        'string.empty': 'Short code is required',
        'any.required': 'Short code is required',
      }),
  }),

  // Pagination validation
  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10),
  }),
};

module.exports = urlValidator;