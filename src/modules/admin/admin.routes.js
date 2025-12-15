import { Router } from "express";
import { authenticate, adminOnly } from "../../middleware/auth.js";
import { authorize, PERMISSIONS } from "../../middleware/rbac.js";
import prisma from "../../config/prisma.js";
import { successResponse, paginatedResponse, buildPaginationResponse, parsePaginationParams, sanitizeAdmin } from "../../utils/helpers.js";
import { NotFoundError, ConflictError } from "../../utils/errors.js";
import { hashPassword } from "../../utils/password.js";
import { HTTP_STATUS } from "../../config/constants.js";

const router = Router();

/**
 * @swagger
 * /api/v1/admin/admins:
 *   get:
 *     summary: Get all admins (Super admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 */
router.get("/admins", authenticate, adminOnly, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);

    const [admins, total] = await Promise.all([
      prisma.admin.findMany({ skip, take: limit, orderBy: { created_at: "desc" } }),
      prisma.admin.count(),
    ]);

    const sanitized = admins.map(sanitizeAdmin);
    const pagination = buildPaginationResponse(page, limit, total);

    res.json(paginatedResponse(sanitized, pagination));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/admin/admins:
 *   post:
 *     summary: Create new admin (Super admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 */
router.post("/admins", authenticate, adminOnly, async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, role } = req.body;

    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    const password_hash = await hashPassword(password);

    const admin = await prisma.admin.create({
      data: { email, password_hash, first_name, last_name, role: role || "admin", is_active: true },
    });

    res.status(HTTP_STATUS.CREATED).json(successResponse(sanitizeAdmin(admin), "Admin created successfully"));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 */
router.get("/dashboard", authenticate, authorize(PERMISSIONS.ADMIN_DASHBOARD), async (req, res, next) => {
  try {
    const [usersCount, therapistsCount, pendingTherapists, bookingsCount, paymentsSum] = await Promise.all([
      prisma.user.count({ where: { deleted_at: null } }),
      prisma.therapist.count({ where: { deleted_at: null, status: "approved" } }),
      prisma.therapist.count({ where: { status: "pending" } }),
      prisma.booking.count(),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "paid" } }),
    ]);

    res.json(successResponse({
      users: usersCount,
      therapists: therapistsCount,
      pendingTherapists,
      bookings: bookingsCount,
      totalRevenue: paymentsSum._sum.amount || 0,
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/admin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 */
router.get("/audit-logs", authenticate, authorize(PERMISSIONS.ADMIN_AUDIT_LOGS), async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ skip, take: limit, orderBy: { created_at: "desc" } }),
      prisma.auditLog.count(),
    ]);

    const pagination = buildPaginationResponse(page, limit, total);
    res.json(paginatedResponse(logs, pagination));
  } catch (error) {
    next(error);
  }
});

export default router;
