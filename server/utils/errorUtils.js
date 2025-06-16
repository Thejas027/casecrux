// utils/errorUtils.js

/**
 * Custom error class for application-specific errors.
 * Allows setting a status code and additional details.
 */
class AppError extends Error {
  constructor(message, statusCode, details, stack) {
    super(message);
    this.statusCode = statusCode || 500;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // Distinguish operational errors from programming errors
    this.details = details;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = { AppError };
