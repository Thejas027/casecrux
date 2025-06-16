const errorHandler = (err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err);

  const statusCode = err.status || res.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    message: message,
    // Optionally, include stack trace in development
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    details: err.details, // Include any additional details from the error object
  });
};

module.exports = errorHandler;
