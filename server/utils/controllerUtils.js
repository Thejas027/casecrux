// utils/controllerUtils.js
const { AppError } = require("./errorUtils");

/**
 * Handles errors in controller functions, passing them to the next error-handling middleware.
 * Logs the error and context.
 * @param {Error} error - The error object caught in the controller.
 * @param {Function} next - The next middleware function.
 * @param {string} [contextMessage='An error occurred'] - A message describing the context of the error.
 */
const handleControllerError = (
  error,
  next,
  contextMessage = "An error occurred"
) => {
  console.error(`${contextMessage}:`, error.message);
  if (error instanceof AppError) {
    next(error); // Pass AppError directly
  } else {
    // Wrap generic errors in AppError for consistent handling, or pass as is
    // For now, let's pass it to the generic error handler which should set a 500 status
    next(
      new AppError(
        error.message,
        error.status || 500,
        error.details,
        error.stack
      )
    );
  }
};

module.exports = { handleControllerError };
