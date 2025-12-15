import { verifyAccessToken, extractTokenFromHeader } from "../utils/jwt.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";
import prisma from "../config/prisma.js";
import { USER_TYPES, ERROR_MESSAGES } from "../config/constants.js";

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new UnauthorizedError("No token provided");
    }

    const decoded = verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      type: decoded.type,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if missing
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        type: decoded.type,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};

/**
 * Require specific user types middleware
 * @param {...string} allowedTypes - Allowed user types (admin, therapist, user)
 */
export const requireUserType = (...allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED));
    }

    if (!allowedTypes.includes(req.user.type)) {
      return next(new ForbiddenError(ERROR_MESSAGES.FORBIDDEN));
    }

    next();
  };
};

/**
 * Admin only middleware
 */
export const adminOnly = requireUserType(USER_TYPES.ADMIN);

/**
 * Therapist only middleware
 */
export const therapistOnly = requireUserType(USER_TYPES.THERAPIST);

/**
 * User (patient) only middleware
 */
export const userOnly = requireUserType(USER_TYPES.USER);

/**
 * Admin or therapist middleware
 */
export const adminOrTherapist = requireUserType(USER_TYPES.ADMIN, USER_TYPES.THERAPIST);

/**
 * Verify user exists and is active
 * Use after authenticate middleware
 */
export const verifyUserActive = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    let user;
    const { id, type } = req.user;

    switch (type) {
      case USER_TYPES.ADMIN:
        user = await prisma.admin.findUnique({
          where: { id },
          select: { id: true, is_active: true },
        });
        if (!user || !user.is_active) {
          throw new UnauthorizedError("Admin account is inactive");
        }
        break;

      case USER_TYPES.THERAPIST:
        user = await prisma.therapist.findUnique({
          where: { id },
          select: { id: true, status: true, deleted_at: true },
        });
        if (!user || user.deleted_at) {
          throw new UnauthorizedError("Therapist account not found");
        }
        if (user.status !== "approved") {
          throw new ForbiddenError("Therapist account is not approved");
        }
        break;

      case USER_TYPES.USER:
        user = await prisma.user.findUnique({
          where: { id },
          select: { id: true, status: true, deleted_at: true },
        });
        if (!user || user.deleted_at) {
          throw new UnauthorizedError("User account not found");
        }
        if (user.status !== "active") {
          throw new ForbiddenError("User account is not active");
        }
        break;

      default:
        throw new UnauthorizedError("Invalid user type");
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user owns the resource or is admin
 * @param {Function} getResourceOwnerId - Function to get owner ID from request
 */
export const ownerOrAdmin = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED);
      }

      // Admins can access any resource
      if (req.user.type === USER_TYPES.ADMIN) {
        return next();
      }

      const ownerId = await getResourceOwnerId(req);

      if (req.user.id !== ownerId) {
        throw new ForbiddenError(ERROR_MESSAGES.FORBIDDEN);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
