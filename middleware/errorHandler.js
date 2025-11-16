export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Default error status and message
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  // Send error response
  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      message: `Route ${req.originalUrl} not found`,
    },
  });
};
