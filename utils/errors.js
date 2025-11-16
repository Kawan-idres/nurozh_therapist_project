import { HTTP_STATUS } from "../config/constants.js";

/**
 * Base API Error class
 */
export class APIError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends APIError {
  constructor(message = "Bad Request") {
    super(message, HTTP_STATUS.BAD_REQUEST);
  }
}

/**
 * Validation Error (422)
 */
export class ValidationError extends APIError {
  constructor(message = "Validation failed", errors = []) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    this.errors = errors;
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends APIError {
  constructor(message = "Resource not found") {
    super(message, HTTP_STATUS.NOT_FOUND);
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends APIError {
  constructor(message = "Unauthorized") {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends APIError {
  constructor(message = "Forbidden") {
    super(message, HTTP_STATUS.FORBIDDEN);
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends APIError {
  constructor(message = "Conflict") {
    super(message, HTTP_STATUS.CONFLICT);
  }
}

/**
 * Database Error (500)
 */
export class DatabaseError extends APIError {
  constructor(message = "Database operation failed") {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalServerError extends APIError {
  constructor(message = "Internal server error") {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
