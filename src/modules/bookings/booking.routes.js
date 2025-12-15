import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize, PERMISSIONS } from "../../middleware/rbac.js";
import prisma from "../../config/prisma.js";
import { successResponse, paginatedResponse, buildPaginationResponse, parsePaginationParams } from "../../utils/helpers.js";
import { NotFoundError, BadRequestError } from "../../utils/errors.js";
import { HTTP_STATUS, BOOKING_STATUS, USER_TYPES } from "../../config/constants.js";

const router = Router();

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     summary: Get user's bookings
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 */
router.get("/", authenticate, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    let where = {};

    if (req.user.type === USER_TYPES.USER) {
      where.user_id = req.user.id;
    } else if (req.user.type === USER_TYPES.THERAPIST) {
      where.therapist_id = req.user.id;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({ where, skip, take: limit, orderBy: { scheduled_start: "desc" } }),
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
 * /api/v1/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 */
router.post("/", authenticate, authorize(PERMISSIONS.BOOKINGS_CREATE), async (req, res, next) => {
  try {
    const { therapist_id, session_type, scheduled_start, scheduled_end, duration_minutes, is_free_session, amount, currency, user_notes } = req.body;

    const booking = await prisma.booking.create({
      data: {
        user_id: req.user.id,
        therapist_id,
        session_type,
        scheduled_start: new Date(scheduled_start),
        scheduled_end: new Date(scheduled_end),
        duration_minutes,
        is_free_session: is_free_session || false,
        amount,
        currency: currency || "USD",
        status: BOOKING_STATUS.PENDING,
        user_notes,
      },
    });

    res.status(HTTP_STATUS.CREATED).json(successResponse(booking, "Booking created successfully"));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 */
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });

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
 * /api/v1/bookings/{id}/confirm:
 *   post:
 *     summary: Confirm booking (Therapist)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 */
router.post("/:id/confirm", authenticate, async (req, res, next) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: BOOKING_STATUS.CONFIRMED, confirmed_at: new Date() },
    });

    res.json(successResponse(booking, "Booking confirmed"));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/bookings/{id}/cancel:
 *   post:
 *     summary: Cancel booking
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 */
router.post("/:id/cancel", authenticate, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: BOOKING_STATUS.CANCELLED,
        cancelled_at: new Date(),
        cancellation_reason: reason,
        cancelled_by: req.user.type,
      },
    });

    res.json(successResponse(booking, "Booking cancelled"));
  } catch (error) {
    next(error);
  }
});

export default router;
