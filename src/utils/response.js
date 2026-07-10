// src/utils/response.js
class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static error(res, message = 'Error occurred', statusCode = 500, error = null) {
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
      };
    }

    return res.status(statusCode).json(response);
  }

  static created(res, data, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  static badRequest(res, message = 'Bad request', error = null) {
    return this.error(res, message, 400, error);
  }

  static unauthorized(res, message = 'Unauthorized', error = null) {
    return this.error(res, message, 401, error);
  }

  static forbidden(res, message = 'Forbidden', error = null) {
    return this.error(res, message, 403, error);
  }

  static notFound(res, message = 'Resource not found', error = null) {
    return this.error(res, message, 404, error);
  }

  static conflict(res, message = 'Resource already exists', error = null) {
    return this.error(res, message, 409, error);
  }

  static validationError(res, errors, message = 'Validation failed', error = null) {
    return res.status(422).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = ApiResponse;