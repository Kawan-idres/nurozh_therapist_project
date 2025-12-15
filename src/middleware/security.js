import helmet from "helmet";
import rateLimit from "express-rate-limit";
import {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  HTTP_STATUS,
} from "../config/constants.js";

/**
 * Helmet middleware for security headers
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * Rate limiter middleware
 */
export const rateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: {
      message: "Too many requests from this IP, please try again later.",
      retryAfter: RATE_LIMIT_WINDOW_MS / 1000,
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  // Skip rate limiting for health check
  skip: (req) => req.path === "/health",
});
