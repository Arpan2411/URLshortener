// src/utils/response.js
const { HTTP_STATUS } = require('../constants');

class ApiResponse {
  static success(res, data, message = 'Success', statusCode = HTTP_STATUS.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static error(res, message = 'Error occurred', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, error = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    // Add error details in development
    if (process.env.NODE_ENV === 'development' && error) {
      response.error = {
        message: error.message,
        stack: error.stack,
        ...(error.name && { name: error.name }),
        ...(error.code && { code: error.code }),
      };
    }

    return res.status(statusCode).json(response);
  }

  static created(res, data, message = 'Resource created successfully') {
    return this.success(res, data, message, HTTP_STATUS.CREATED);
  }

  static badRequest(res, message = 'Bad request', error = null) {
    return this.error(res, message, HTTP_STATUS.BAD_REQUEST, error);
  }

  static unauthorized(res, message = 'Unauthorized', error = null) {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED, error);
  }

  static forbidden(res, message = 'Forbidden', error = null) {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN, error);
  }

  static notFound(res, message = 'Resource not found', error = null) {
    return this.error(res, message, HTTP_STATUS.NOT_FOUND, error);
  }

  static conflict(res, message = 'Resource already exists', error = null) {
    return this.error(res, message, HTTP_STATUS.CONFLICT, error);
  }

  static validationError(res, errors, message = 'Validation failed', error = null) {
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      message,
      errors: Array.isArray(errors) ? errors : [errors],
      timestamp: new Date().toISOString(),
    });
  }

  static tooManyRequests(res, message = 'Too many requests', retryAfter = 60) {
    return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      message,
      retryAfter,
      timestamp: new Date().toISOString(),
    });
  }

  // Paginated response
  static paginated(res, data, pagination, message = 'Success') {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
        hasNext: pagination.page < pagination.totalPages,
        hasPrev: pagination.page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Streaming response (for large data)
  static stream(res, stream, contentType = 'application/json') {
    res.setHeader('Content-Type', contentType);
    return stream.pipe(res);
  }

  // File download response
  static download(res, filePath, filename) {
    res.download(filePath, filename, (err) => {
      if (err) {
        this.error(res, 'Error downloading file', HTTP_STATUS.INTERNAL_SERVER_ERROR, err);
      }
    });
  }
}

module.exports = ApiResponse;