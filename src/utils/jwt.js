import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UnauthorizedError } from "./errors.js";
import { ERROR_MESSAGES } from "../config/constants.js";

/**
 * Generate access token
 * @param {Object} payload - Token payload (user info)
 * @returns {string} JWT access token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
};

/**
 * Generate refresh token
 * @param {Object} payload - Token payload (user info)
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
};

/**
 * Generate both access and refresh tokens
 * @param {Object} payload - Token payload
 * @returns {Object} Object with accessToken and refreshToken
 */
export const generateTokenPair = (payload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 * @throws {UnauthorizedError} If token is invalid or expired
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_EXPIRED);
    }
    throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_INVALID);
  }
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 * @throws {UnauthorizedError} If token is invalid or expired
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_EXPIRED);
    }
    throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_INVALID);
  }
};

/**
 * Decode token without verification (useful for debugging)
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token or null
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
};

/**
 * Get token expiration time in seconds
 * @param {string} expiresIn - Expiration string (e.g., "15m", "7d")
 * @returns {number} Expiration time in seconds
 */
export const getExpirationInSeconds = (expiresIn) => {
  const units = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 900; // Default 15 minutes
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];
  return value * units[unit];
};

/**
 * Calculate expiration date
 * @param {string} expiresIn - Expiration string (e.g., "15m", "7d")
 * @returns {Date} Expiration date
 */
export const calculateExpirationDate = (expiresIn) => {
  const seconds = getExpirationInSeconds(expiresIn);
  return new Date(Date.now() + seconds * 1000);
};
