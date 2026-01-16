import logger from "../config/logger.js";
import { env } from "../config/env.js";
import { APIError, ValidationError } from "../utils/errors.js";
import { HTTP_STATUS, NODE_ENV } from "../config/constants.js";

/**
 * Map Prisma error codes to user-friendly messages
 */
const prismaErrorMessages = {
  P2000: "The provided value is too long for the field",
  P2001: "Record not found",
  P2002: "A record with this value already exists",
  P2003: "Foreign key constraint failed - related record not found",
  P2004: "Constraint failed on the database",
  P2005: "Invalid value for the field",
  P2006: "The provided value is invalid",
  P2007: "Data validation error",
  P2008: "Failed to parse the query",
  P2009: "Failed to validate the query",
  P2010: "Raw query failed",
  P2011: "Null constraint violation",
  P2012: "Missing required value",
  P2013: "Missing required argument",
  P2014: "Required relation violation",
  P2015: "Related record not found",
  P2016: "Query interpretation error",
  P2017: "Records not connected",
  P2018: "Required connected records not found",
  P2019: "Input error",
  P2020: "Value out of range",
  P2021: "Table does not exist",
  P2022: "Column does not exist",
  P2023: "Inconsistent column data",
  P2024: "Connection pool timeout",
  P2025: "Record not found",
};

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Default error properties
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal server error";
  let errors = [];

  // Handle Prisma errors
  if (err.constructor.name === "PrismaClientKnownRequestError") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = prismaErrorMessages[err.code] || "Database operation failed";

    // Specific handling for common errors
    if (err.code === "P2002") {
      const field = err.meta?.target?.[0] || "field";
      message = `A record with this ${field} already exists`;
    } else if (err.code === "P2003" || err.code === "P2025") {
      message = "Referenced record not found. Please check the provided IDs.";
      statusCode = HTTP_STATUS.NOT_FOUND;
    }
  }

  // Handle Prisma validation errors
  if (err.constructor.name === "PrismaClientValidationError") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    // Show actual error for debugging (remove in production)
    console.error("Prisma Validation Error:", err.message);
    message = err.message.split('\n').slice(-3).join(' ').trim() || "Invalid data provided";
  }

  // Handle ValidationError with field-level errors
  if (err instanceof ValidationError) {
    errors = err.errors;
  }

  // Log error with request context (always log full details server-side)
  const errorLog = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message,
    originalMessage: err.message,
    ...(errors.length > 0 && { errors }),
  };

  if (statusCode >= 500) {
    logger.error("Server error", { ...errorLog, stack: err.stack });
  } else {
    logger.warn("Client error", errorLog);
  }

  // Build error response - hide internal details
  const errorResponse = {
    success: false,
    error: {
      message,
      ...(errors.length > 0 && { errors }),
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
