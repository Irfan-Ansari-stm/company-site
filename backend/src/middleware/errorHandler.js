// src/middleware/errorHandler.js
const logger = require('../config/logger');

// Central error handler
const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack:   err.stack,
    path:    req.path,
    method:  req.method,
    userId:  req.userId,
    ip:      req.ip,
  });

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        return res.status(409).json({
          success: false,
          message: 'Resource already exists',
          error:   err.detail || err.message,
        });
      case '23503': // foreign_key_violation
        return res.status(400).json({
          success: false,
          message: 'Referenced resource not found',
          error:   err.detail || err.message,
        });
      case '23502': // not_null_violation
        return res.status(400).json({
          success: false,
          message: 'Required field missing',
          error:   err.detail || err.message,
        });
      case '22P02': // invalid input syntax (e.g. UUID)
        return res.status(400).json({
          success: false,
          message: 'Invalid input format',
        });
    }
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// 404 handler
const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Custom HTTP error
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = { errorHandler, notFound, asyncHandler, AppError };
