import { Router } from "express";
import { authenticate, adminOnly } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
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
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 */
router.get("/dashboard", authenticate, authorize("admin:dashboard"), async (req, res, next) => {
  try {
    // Get current date boundaries for today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get this week's start (Sunday)
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    // Get this month's start
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      // User stats
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      // Therapist stats
      totalTherapists,
      approvedTherapists,
      pendingTherapists,
      rejectedTherapists,
      // Booking stats
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      bookingsToday,
      // Payment stats
      paymentsSum,
      paymentsThisMonth,
      // Session stats
      totalSessions,
      completedSessions,
    ] = await Promise.all([
      // Users
      prisma.user.count({ where: { deleted_at: null } }),
      prisma.user.count({ where: { deleted_at: null, status: "active" } }),
      prisma.user.count({ where: { deleted_at: null, created_at: { gte: today, lt: tomorrow } } }),
      prisma.user.count({ where: { deleted_at: null, created_at: { gte: weekStart } } }),
      prisma.user.count({ where: { deleted_at: null, created_at: { gte: monthStart } } }),
      // Therapists
      prisma.therapist.count({ where: { deleted_at: null } }),
      prisma.therapist.count({ where: { deleted_at: null, status: "approved" } }),
      prisma.therapist.count({ where: { status: "pending" } }),
      prisma.therapist.count({ where: { status: "rejected" } }),
      // Bookings
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "pending" } }),
      prisma.booking.count({ where: { status: "confirmed" } }),
      prisma.booking.count({ where: { status: "completed" } }),
      prisma.booking.count({ where: { status: "cancelled" } }),
      prisma.booking.count({ where: { created_at: { gte: today, lt: tomorrow } } }),
      // Payments
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "paid" } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "paid", created_at: { gte: monthStart } } }),
      // Sessions
      prisma.session.count(),
      prisma.session.count({ where: { status: "completed" } }),
    ]);

    res.json(successResponse({
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth,
      },
      therapists: {
        total: totalTherapists,
        approved: approvedTherapists,
        pending: pendingTherapists,
        rejected: rejectedTherapists,
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        today: bookingsToday,
      },
      sessions: {
        total: totalSessions,
        completed: completedSessions,
      },
      revenue: {
        total: paymentsSum._sum.amount || 0,
        thisMonth: paymentsThisMonth._sum.amount || 0,
      },
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users with filters
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Users list retrieved successfully
 */
router.get("/users", authenticate, authorize("users:read"), async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { status, search } = req.query;

    const where = { deleted_at: null };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          email: true,
          phone: true,
          first_name: true,
          last_name: true,
          gender: true,
          date_of_birth: true,
          preferred_language: true,
          status: true,
          free_session_used: true,
          created_at: true,
          last_login_at: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const pagination = buildPaginationResponse(page, limit, total);
    res.json(paginatedResponse(users, pagination));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       404:
 *         description: User not found
 */
router.get("/users/:id", authenticate, authorize("users:read"), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        gender: true,
        date_of_birth: true,
        preferred_language: true,
        timezone: true,
        status: true,
        free_session_used: true,
        created_at: true,
        updated_at: true,
        last_login_at: true,
        bookings: {
          take: 10,
          orderBy: { created_at: "desc" },
          select: {
            id: true,
            status: true,
            session_type: true,
            scheduled_at: true,
            therapist: {
              select: { id: true, first_name: true, last_name: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    res.json(successResponse(user));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/admin/therapists:
 *   get:
 *     summary: Get all therapists with filters
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, suspended]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Therapists list retrieved successfully
 */
router.get("/therapists", authenticate, authorize("therapists:read"), async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { status, search } = req.query;

    const where = { deleted_at: null };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [therapists, total] = await Promise.all([
      prisma.therapist.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          email: true,
          phone: true,
          first_name: true,
          last_name: true,
          title: true,
          gender: true,
          years_of_experience: true,
          license_number: true,
          status: true,
          session_rate: true,
          created_at: true,
          approved_at: true,
          last_login_at: true,
        },
      }),
      prisma.therapist.count({ where }),
    ]);

    const pagination = buildPaginationResponse(page, limit, total);
    res.json(paginatedResponse(therapists, pagination));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/admin/therapists/{id}:
 *   get:
 *     summary: Get therapist by ID with full details
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Therapist details retrieved successfully
 *       404:
 *         description: Therapist not found
 */
router.get("/therapists/:id", authenticate, authorize("therapists:read"), async (req, res, next) => {
  try {
    const therapist = await prisma.therapist.findUnique({
      where: { id: req.params.id },
      include: {
        specialties: {
          include: { specialty: true },
        },
        documents: true,
        availability: true,
        _count: {
          select: {
            bookings: true,
            sessions: true,
          },
        },
      },
    });

    if (!therapist) {
      throw new NotFoundError("Therapist not found");
    }

    // Remove password_hash
    const { password_hash, ...therapistData } = therapist;

    res.json(successResponse(therapistData));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/admin/bookings:
 *   get:
 *     summary: Get all bookings with filters
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, rescheduled, completed, cancelled, no_show]
 *       - in: query
 *         name: therapist_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Bookings list retrieved successfully
 */
router.get("/bookings", authenticate, authorize("bookings:read"), async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { status, therapist_id, user_id, from_date, to_date } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (therapist_id) {
      where.therapist_id = therapist_id;
    }

    if (user_id) {
      where.user_id = user_id;
    }

    if (from_date || to_date) {
      where.scheduled_at = {};
      if (from_date) {
        where.scheduled_at.gte = new Date(from_date);
      }
      if (to_date) {
        const endDate = new Date(to_date);
        endDate.setDate(endDate.getDate() + 1);
        where.scheduled_at.lt = endDate;
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          user: {
            select: { id: true, first_name: true, last_name: true, email: true },
          },
          therapist: {
            select: { id: true, first_name: true, last_name: true, email: true },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const pagination = buildPaginationResponse(page, limit, total);
    res.json(paginatedResponse(bookings, pagination));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/admin/bookings/{id}:
 *   get:
 *     summary: Get booking by ID with full details
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *       404:
 *         description: Booking not found
 */
router.get("/bookings/:id", authenticate, authorize("bookings:read"), async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
        therapist: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            session_rate: true,
          },
        },
        session: true,
        payment: true,
      },
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    res.json(successResponse(booking));
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
router.get("/audit-logs", authenticate, authorize("admin:audit_logs"), async (req, res, next) => {
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
