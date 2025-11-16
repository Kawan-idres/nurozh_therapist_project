import logger from "../config/logger.js";
import { env } from "../config/env.js";
import { APIError, ValidationError } from "../utils/errors.js";
import { HTTP_STATUS, NODE_ENV } from "../config/constants.js";

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Default error properties
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal server error";
  let errors = [];

  // Handle ValidationError with field-level errors
  if (err instanceof ValidationError) {
    errors = err.errors;
  }

  // Log error with request context
  const errorLog = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message,
    ...(errors.length > 0 && { errors }),
  };

  if (statusCode >= 500) {
    logger.error("Server error", { ...errorLog, stack: err.stack });
  } else {
    logger.warn("Client error", errorLog);
  }

  // Build error response
  const errorResponse = {
    success: false,
    error: {
      message,
      ...(errors.length > 0 && { errors }),
      ...(env.NODE_ENV === NODE_ENV.DEVELOPMENT && {
        stack: err.stack,
        ...(!(err instanceof APIError) && { type: err.constructor.name }),
      }),
    },
    requestId: req.id,
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res) => {
  logger.warn("Route not found", {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
  });

  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
    requestId: req.id,
  });
};
