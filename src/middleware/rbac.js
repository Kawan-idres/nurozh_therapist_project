import prisma from "../config/prisma.js";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";
import { ERROR_MESSAGES, USER_TYPES } from "../config/constants.js";

// Cache for role permissions (in production, use Redis)
const permissionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get permissions for a role from cache or database
 * @param {string} roleName - Role name
 * @returns {Promise<Set<string>>} Set of permission names
 */
const getRolePermissions = async (roleName) => {
  const cacheKey = `role:${roleName}`;
  const cached = permissionCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.permissions;
  }

  // Fetch role with permissions from database
  const role = await prisma.role.findUnique({
    where: { name: roleName },
    select: { id: true, is_active: true },
  });

  if (!role || !role.is_active) {
    return new Set();
  }

  // Get role permissions
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { role_id: role.id },
    select: { permission_id: true },
  });

  const permissionIds = rolePermissions.map((rp) => rp.permission_id);

  const permissions = await prisma.permission.findMany({
    where: { id: { in: permissionIds } },
    select: { name: true },
  });

  const permissionSet = new Set(permissions.map((p) => p.name));

  // Cache the result
  permissionCache.set(cacheKey, {
    permissions: permissionSet,
    timestamp: Date.now(),
  });

  return permissionSet;
};

/**
 * Clear permission cache (call when roles/permissions are updated)
 * @param {string} roleName - Optional specific role to clear
 */
export const clearPermissionCache = (roleName = null) => {
  if (roleName) {
    permissionCache.delete(`role:${roleName}`);
  } else {
    permissionCache.clear();
  }
};

/**
 * Authorization middleware - checks if user has required permission
 * @param {string} requiredPermission - Permission name (e.g., "users:read", "bookings:create")
 * @returns {Function} Express middleware
 */
export const authorize = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED);
      }

      const { type, role } = req.user;

      // Super admin bypasses permission checks
      if (type === USER_TYPES.ADMIN && role === "super_admin") {
        return next();
      }

      // Get role name based on user type
      let roleName;
      if (type === USER_TYPES.ADMIN) {
        roleName = role || "admin";
      } else if (type === USER_TYPES.THERAPIST) {
        roleName = "therapist";
      } else if (type === USER_TYPES.USER) {
        roleName = "patient";
      } else {
        throw new ForbiddenError(ERROR_MESSAGES.FORBIDDEN);
      }

      // Get permissions for the role
      const permissions = await getRolePermissions(roleName);

      // Check if user has the required permission
      if (!permissions.has(requiredPermission)) {
        throw new ForbiddenError(
          `You don't have permission to perform this action. Required: ${requiredPermission}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check multiple permissions (user must have ALL)
 * @param {...string} requiredPermissions - Permission names
 * @returns {Function} Express middleware
 */
export const authorizeAll = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED);
      }

      const { type, role } = req.user;

      // Super admin bypasses permission checks
      if (type === USER_TYPES.ADMIN && role === "super_admin") {
        return next();
      }

      // Get role name based on user type
      let roleName;
      if (type === USER_TYPES.ADMIN) {
        roleName = role || "admin";
      } else if (type === USER_TYPES.THERAPIST) {
        roleName = "therapist";
      } else if (type === USER_TYPES.USER) {
        roleName = "patient";
      } else {
        throw new ForbiddenError(ERROR_MESSAGES.FORBIDDEN);
      }

      const permissions = await getRolePermissions(roleName);

      // Check if user has all required permissions
      const missingPermissions = requiredPermissions.filter(
        (p) => !permissions.has(p)
      );

      if (missingPermissions.length > 0) {
        throw new ForbiddenError(
          `Missing permissions: ${missingPermissions.join(", ")}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check multiple permissions (user must have ANY)
 * @param {...string} requiredPermissions - Permission names
 * @returns {Function} Express middleware
 */
export const authorizeAny = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED);
      }

      const { type, role } = req.user;

      // Super admin bypasses permission checks
      if (type === USER_TYPES.ADMIN && role === "super_admin") {
        return next();
      }

      // Get role name based on user type
      let roleName;
      if (type === USER_TYPES.ADMIN) {
        roleName = role || "admin";
      } else if (type === USER_TYPES.THERAPIST) {
        roleName = "therapist";
      } else if (type === USER_TYPES.USER) {
        roleName = "patient";
      } else {
        throw new ForbiddenError(ERROR_MESSAGES.FORBIDDEN);
      }

      const permissions = await getRolePermissions(roleName);

      // Check if user has any of the required permissions
      const hasAny = requiredPermissions.some((p) => permissions.has(p));

      if (!hasAny) {
        throw new ForbiddenError(
          `You need one of these permissions: ${requiredPermissions.join(", ")}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Common permission constants
export const PERMISSIONS = {
  // Users
  USERS_READ: "users:read",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",

  // Therapists
  THERAPISTS_READ: "therapists:read",
  THERAPISTS_CREATE: "therapists:create",
  THERAPISTS_UPDATE: "therapists:update",
  THERAPISTS_DELETE: "therapists:delete",
  THERAPISTS_APPROVE: "therapists:approve",

  // Bookings
  BOOKINGS_READ: "bookings:read",
  BOOKINGS_CREATE: "bookings:create",
  BOOKINGS_UPDATE: "bookings:update",
  BOOKINGS_DELETE: "bookings:delete",

  // Sessions
  SESSIONS_READ: "sessions:read",
  SESSIONS_CREATE: "sessions:create",
  SESSIONS_UPDATE: "sessions:update",

  // Payments
  PAYMENTS_READ: "payments:read",
  PAYMENTS_CREATE: "payments:create",
  PAYMENTS_REFUND: "payments:refund",

  // Conversations
  CONVERSATIONS_READ: "conversations:read",
  CONVERSATIONS_CREATE: "conversations:create",
  MESSAGES_READ: "messages:read",
  MESSAGES_CREATE: "messages:create",

  // Questionnaires
  QUESTIONNAIRES_READ: "questionnaires:read",
  QUESTIONNAIRES_CREATE: "questionnaires:create",
  QUESTIONNAIRES_UPDATE: "questionnaires:update",
  QUESTIONNAIRES_DELETE: "questionnaires:delete",
  ANSWERS_READ: "answers:read",
  ANSWERS_CREATE: "answers:create",

  // Specialties
  SPECIALTIES_READ: "specialties:read",
  SPECIALTIES_CREATE: "specialties:create",
  SPECIALTIES_UPDATE: "specialties:update",
  SPECIALTIES_DELETE: "specialties:delete",

  // Subscriptions
  SUBSCRIPTIONS_READ: "subscriptions:read",
  SUBSCRIPTIONS_CREATE: "subscriptions:create",
  SUBSCRIPTIONS_UPDATE: "subscriptions:update",
  SUBSCRIPTIONS_CANCEL: "subscriptions:cancel",

  // Admin specific
  ADMIN_DASHBOARD: "admin:dashboard",
  ADMIN_REPORTS: "admin:reports",
  ADMIN_SETTINGS: "admin:settings",
  ADMIN_AUDIT_LOGS: "admin:audit_logs",

  // Uploads
  UPLOADS_CREATE: "uploads:create",
  UPLOADS_DELETE: "uploads:delete",

  // Notifications
  NOTIFICATIONS_READ: "notifications:read",
  NOTIFICATIONS_CREATE: "notifications:create",
  NOTIFICATIONS_TEMPLATES: "notifications:templates",

  // Payouts
  PAYOUTS_READ: "payouts:read",
  PAYOUTS_CREATE: "payouts:create",
  PAYOUTS_PROCESS: "payouts:process",
};
