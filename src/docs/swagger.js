// src/docs/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'URL Shortener API',
      version: '1.0.0',
      description: `
        A powerful URL shortening service with:
        - 🔗 URL shortening with custom codes
        - ⚡ Redis caching for fast redirects
        - 🛡️ Rate limiting to prevent abuse
        - 📊 Analytics and click tracking
        - 🔒 Input validation and sanitization
      `,
      contact: {
        name: 'API Support',
        email: 'arpanchatterjee@proton.me',
        url: 'https://github.com/Arpan2411/',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Local server',
      },
    ],
    tags: [
      {
        name: 'URLs',
        description: 'URL shortening operations',
      },
      {
        name: 'Redirect',
        description: 'URL redirect operations',
      },
      {
        name: 'Analytics',
        description: 'URL analytics and statistics',
      },
      {
        name: 'Rate Limiting',
        description: 'Rate limit management',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
    ],
    components: {
      schemas: {
        Url: {
          type: 'object',
          properties: {
            shortCode: {
              type: 'string',
              description: 'Unique short code (7 characters)',
              example: 'abc1234',
            },
            originalUrl: {
              type: 'string',
              description: 'Original long URL',
              example: 'https://example.com/very/long/url/path',
            },
            shortUrl: {
              type: 'string',
              description: 'Generated short URL',
              example: 'http://localhost:3000/abc1234',
            },
            clicks: {
              type: 'integer',
              description: 'Number of times the short URL has been accessed',
              example: 42,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            lastAccessedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last access timestamp',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the URL is active',
              example: true,
            },
          },
        },
        CreateUrlRequest: {
          type: 'object',
          required: ['originalUrl'],
          properties: {
            originalUrl: {
              type: 'string',
              description: 'URL to shorten',
              example: 'https://example.com/very/long/url/path',
            },
            customCode: {
              type: 'string',
              description: 'Custom short code (optional)',
              example: 'my-link',
              minLength: 3,
              maxLength: 20,
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Expiration date (optional)',
              example: '2024-12-31T23:59:59.000Z',
            },
          },
        },
        CreateUrlResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                shortCode: { type: 'string' },
                shortUrl: { type: 'string' },
                originalUrl: { type: 'string' },
                isExisting: { type: 'boolean' },
                clicks: { type: 'integer' },
                createdAt: { type: 'string', format: 'date-time' },
                fromCache: { type: 'boolean' },
              },
            },
            message: {
              type: 'string',
              example: 'Short URL created successfully',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        RateLimitStatus: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string',
              description: 'Client identifier (IP or user ID)',
            },
            limit: {
              type: 'integer',
              description: 'Maximum requests allowed',
              example: 100,
            },
            current: {
              type: 'integer',
              description: 'Current request count',
              example: 25,
            },
            remaining: {
              type: 'integer',
              description: 'Remaining requests',
              example: 75,
            },
            resetIn: {
              type: 'integer',
              description: 'Seconds until reset',
              example: 300,
            },
            resetAt: {
              type: 'string',
              format: 'date-time',
              description: 'Reset timestamp',
            },
          },
        },
        BulkCreateRequest: {
          type: 'object',
          required: ['urls'],
          properties: {
            urls: {
              type: 'array',
              description: 'Array of URLs to shorten',
              items: {
                type: 'string',
                format: 'uri',
              },
              example: [
                'https://example1.com',
                'https://example2.com',
                'https://example3.com',
              ],
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                urls: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Url' },
                },
                total: { type: 'integer' },
                page: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
      parameters: {
        shortCodeParam: {
          name: 'shortCode',
          in: 'path',
          required: true,
          description: 'Short code of the URL (7 characters)',
          schema: {
            type: 'string',
            pattern: '^[a-zA-Z0-9_-]{7}$',
            example: 'abc1234',
          },
        },
        pageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
        },
        limitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page (max 100)',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
          },
        },
      },
      responses: {
        TooManyRequests: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string' },
                  retryAfter: { type: 'integer' },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string' },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: { type: 'string' },
                        message: { type: 'string' },
                      },
                    },
                  },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
    paths: {
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check endpoint',
          description: 'Check if the API is running',
          responses: {
            200: {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'OK' },
                      uptime: { type: 'number' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/urls/shorten': {
        post: {
          tags: ['URLs'],
          summary: 'Create a short URL',
          description: 'Shorten a long URL. Returns existing short URL if already shortened.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateUrlRequest',
                },
              },
            },
          },
          responses: {
            201: {
              description: 'URL shortened successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CreateUrlResponse',
                  },
                },
              },
            },
            200: {
              description: 'URL already exists',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CreateUrlResponse',
                  },
                },
              },
            },
            400: {
              description: 'Invalid URL',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            429: {
              $ref: '#/components/responses/TooManyRequests',
            },
          },
        },
      },
      '/api/urls/bulk': {
        post: {
          tags: ['URLs'],
          summary: 'Bulk create short URLs',
          description: 'Create multiple short URLs in one request (max 100)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/BulkCreateRequest',
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Bulk URLs created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            success: { type: 'boolean' },
                            shortCode: { type: 'string' },
                            shortUrl: { type: 'string' },
                            originalUrl: { type: 'string' },
                            isExisting: { type: 'boolean' },
                            error: { type: 'string' },
                          },
                        },
                      },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Invalid request',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            429: {
              $ref: '#/components/responses/TooManyRequests',
            },
          },
        },
      },
      '/api/urls': {
        get: {
          tags: ['URLs'],
          summary: 'Get all URLs',
          description: 'Get paginated list of all URLs',
          parameters: [
            {
              $ref: '#/components/parameters/pageParam',
            },
            {
              $ref: '#/components/parameters/limitParam',
            },
          ],
          responses: {
            200: {
              description: 'URLs retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/PaginatedResponse',
                  },
                },
              },
            },
            429: {
              $ref: '#/components/responses/TooManyRequests',
            },
          },
        },
      },
      '/api/urls/{shortCode}': {
        get: {
          tags: ['Redirect'],
          summary: 'Redirect to original URL',
          description: 'Redirects to the original URL using the short code',
          parameters: [
            {
              $ref: '#/components/parameters/shortCodeParam',
            },
          ],
          responses: {
            302: {
              description: 'Redirect to original URL',
              headers: {
                Location: {
                  schema: {
                    type: 'string',
                  },
                  description: 'Original URL',
                },
              },
            },
            404: {
              description: 'Short URL not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            429: {
              $ref: '#/components/responses/TooManyRequests',
            },
          },
        },
        delete: {
          tags: ['URLs'],
          summary: 'Delete a short URL',
          description: 'Soft delete a short URL (marks as inactive)',
          parameters: [
            {
              $ref: '#/components/parameters/shortCodeParam',
            },
          ],
          responses: {
            200: {
              description: 'URL deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
            404: {
              description: 'Short URL not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            429: {
              $ref: '#/components/responses/TooManyRequests',
            },
          },
        },
      },
      '/api/urls/{shortCode}/stats': {
        get: {
          tags: ['Analytics'],
          summary: 'Get URL statistics',
          description: 'Get detailed statistics for a short URL including click count',
          parameters: [
            {
              $ref: '#/components/parameters/shortCodeParam',
            },
          ],
          responses: {
            200: {
              description: 'Statistics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        $ref: '#/components/schemas/Url',
                      },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
            404: {
              description: 'Short URL not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            429: {
              $ref: '#/components/responses/TooManyRequests',
            },
          },
        },
      },
      '/api/urls/count': {
        get: {
          tags: ['Analytics'],
          summary: 'Get total URL count',
          description: 'Get the total number of active URLs',
          responses: {
            200: {
              description: 'Count retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          count: { type: 'integer' },
                        },
                      },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
            429: {
              $ref: '#/components/responses/TooManyRequests',
            },
          },
        },
      },
      '/api/rate-limit/status': {
        get: {
          tags: ['Rate Limiting'],
          summary: 'Get rate limit status',
          description: 'Check your current rate limit usage',
          responses: {
            200: {
              description: 'Rate limit status retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        $ref: '#/components/schemas/RateLimitStatus',
                      },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/rate-limit/analytics': {
        get: {
          tags: ['Rate Limiting'],
          summary: 'Get rate limit analytics',
          description: 'Get detailed rate limit analytics (admin only)',
          responses: {
            200: {
              description: 'Analytics retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          totalKeys: { type: 'integer' },
                          keys: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                key: { type: 'string' },
                                value: { type: 'integer' },
                                ttl: { type: 'integer' },
                              },
                            },
                          },
                        },
                      },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
            429: {
              $ref: '#/components/responses/TooManyRequests',
            },
          },
        },
      },
      '/api/rate-limit/alerts': {
        get: {
          tags: ['Rate Limiting'],
          summary: 'Get rate limit alerts',
          description: 'Get recent rate limit alerts (admin only)',
          responses: {
            200: {
              description: 'Alerts retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          alerts: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                level: { type: 'string' },
                                identifier: { type: 'string' },
                                usage: { type: 'string' },
                                timestamp: { type: 'string', format: 'date-time' },
                              },
                            },
                          },
                          count: { type: 'integer' },
                        },
                      },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
            429: {
              $ref: '#/components/responses/TooManyRequests',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const specs = swaggerJsdoc(options);

/**
 * Setup Swagger UI
 */
const setupSwagger = (app) => {
  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'URL Shortener API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      docExpansion: 'list',
    },
  }));

  // Serve JSON specification
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Serve YAML specification
  app.get('/api-docs.yaml', (req, res) => {
    const yaml = require('js-yaml');
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yaml.dump(specs));
  });

  console.log('📚 Swagger documentation available at /api-docs');
  return app;
};

/**
 * Generate Swagger documentation as JSON
 */
const getSwaggerSpec = () => {
  return specs;
};

module.exports = {
  setupSwagger,
  getSwaggerSpec,
};