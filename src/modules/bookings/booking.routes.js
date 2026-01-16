import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
import prisma from "../../config/prisma.js";
import { successResponse, paginatedResponse, buildPaginationResponse, parsePaginationParams } from "../../utils/helpers.js";
import { NotFoundError, BadRequestError, ForbiddenError } from "../../utils/errors.js";
import { HTTP_STATUS, BOOKING_STATUS, USER_TYPES, FREE_SESSION_CONFIG, DEFAULTS } from "../../config/constants.js";

const router = Router();

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     summary: Get user's bookings
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled, no_show, rescheduled]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 */
router.get("/", authenticate, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { status } = req.query;

    let where = {};

    // Filter by user type
    if (req.user.type === USER_TYPES.USER) {
      where.user_id = req.user.id;
    } else if (req.user.type === USER_TYPES.THERAPIST) {
      where.therapist_id = req.user.id;
    }

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduled_start: "desc" },
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
 * /api/v1/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - therapist_id
 *               - session_type
 *               - scheduled_start
 *             properties:
 *               therapist_id:
 *                 type: string
 *               session_type:
 *                 type: string
 *                 enum: [video, audio, chat]
 *               scheduled_start:
 *                 type: string
 *                 format: date-time
 *               user_notes:
 *                 type: string
 */
router.post("/", authenticate, authorize("bookings:create"), async (req, res, next) => {
  try {
    const { therapist_id, session_type, scheduled_start, user_notes } = req.body;

    const therapistIdInt = parseInt(therapist_id, 10);
    if (isNaN(therapistIdInt)) {
      throw new BadRequestError("Invalid therapist ID");
    }

    // Get the user to check free session status
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Get the therapist to get their rates
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistIdInt },
    });

    if (!therapist) {
      throw new NotFoundError("Therapist not found");
    }

    // Determine if this is a free session
    const is_free_session = !user.free_session_used;

    // Calculate duration and amount
    let duration_minutes;
    let amount;
    let currency = therapist.session_rate_currency || DEFAULTS.CURRENCY;

    if (is_free_session) {
      // Free session: 30 minutes, no charge
      duration_minutes = FREE_SESSION_CONFIG.DURATION_MINUTES;
      amount = 0;
    } else {
      // Paid session: use therapist's default duration and rate
      duration_minutes = therapist.session_duration_minutes || DEFAULTS.SESSION_DURATION_MINUTES;
      amount = therapist.session_rate_amount;
    }

    // Calculate scheduled_end
    const startDate = new Date(scheduled_start);
    const endDate = new Date(startDate.getTime() + duration_minutes * 60 * 1000);

    const booking = await prisma.booking.create({
      data: {
        user_id: req.user.id,
        therapist_id: therapistIdInt,
        session_type,
        scheduled_start: startDate,
        scheduled_end: endDate,
        duration_minutes,
        is_free_session,
        amount,
        currency,
        status: BOOKING_STATUS.PENDING,
        user_notes,
      },
    });

    res.status(HTTP_STATUS.CREATED).json(successResponse(booking, "Booking created successfully. Waiting for therapist confirmation."));
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
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      throw new NotFoundError("Booking not found");
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    // Check authorization
    if (req.user.type === USER_TYPES.USER && booking.user_id !== req.user.id) {
      throw new ForbiddenError("You can only view your own bookings");
    }
    if (req.user.type === USER_TYPES.THERAPIST && booking.therapist_id !== req.user.id) {
      throw new ForbiddenError("You can only view bookings assigned to you");
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
 *     summary: Confirm/Accept booking (Therapist only)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 */
router.post("/:id/confirm", authenticate, async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      throw new NotFoundError("Booking not found");
    }

    // Only therapists can confirm bookings
    if (req.user.type !== USER_TYPES.THERAPIST) {
      throw new ForbiddenError("Only therapists can confirm bookings");
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!existingBooking) {
      throw new NotFoundError("Booking not found");
    }

    // Verify this booking belongs to this therapist
    if (existingBooking.therapist_id !== req.user.id) {
      throw new ForbiddenError("You can only confirm your own bookings");
    }

    if (existingBooking.status !== BOOKING_STATUS.PENDING) {
      throw new BadRequestError(`Cannot confirm a booking with status: ${existingBooking.status}`);
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BOOKING_STATUS.CONFIRMED,
        confirmed_at: new Date()
      },
    });

    // If this is a free session, mark user's free session as used
    if (booking.is_free_session) {
      await prisma.user.update({
        where: { id: booking.user_id },
        data: { free_session_used: true },
      });
    }

    res.json(successResponse(booking, "Booking confirmed successfully"));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/bookings/{id}/reschedule:
 *   post:
 *     summary: Reschedule booking (Therapist proposes new time)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_scheduled_start
 *             properties:
 *               new_scheduled_start:
 *                 type: string
 *                 format: date-time
 *               reason:
 *                 type: string
 */
router.post("/:id/reschedule", authenticate, async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      throw new NotFoundError("Booking not found");
    }

    const { new_scheduled_start, reason } = req.body;

    if (!new_scheduled_start) {
      throw new BadRequestError("New scheduled start time is required");
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!existingBooking) {
      throw new NotFoundError("Booking not found");
    }

    // Verify authorization
    const isTherapist = req.user.type === USER_TYPES.THERAPIST && existingBooking.therapist_id === req.user.id;
    const isUser = req.user.type === USER_TYPES.USER && existingBooking.user_id === req.user.id;

    if (!isTherapist && !isUser) {
      throw new ForbiddenError("You can only reschedule your own bookings");
    }

    if (existingBooking.status === BOOKING_STATUS.COMPLETED || existingBooking.status === BOOKING_STATUS.CANCELLED) {
      throw new BadRequestError(`Cannot reschedule a booking with status: ${existingBooking.status}`);
    }

    // Calculate new end time based on existing duration
    const newStartDate = new Date(new_scheduled_start);
    const newEndDate = new Date(newStartDate.getTime() + existingBooking.duration_minutes * 60 * 1000);

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BOOKING_STATUS.RESCHEDULED,
        scheduled_start: newStartDate,
        scheduled_end: newEndDate,
        reschedule_reason: reason,
        rescheduled_at: new Date(),
        rescheduled_from_booking_id: existingBooking.id,
        // Reset confirmation - needs to be confirmed again after reschedule
        confirmed_at: null,
      },
    });

    res.json(successResponse(booking, "Booking rescheduled successfully. Waiting for confirmation."));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/bookings/{id}/accept-reschedule:
 *   post:
 *     summary: Accept rescheduled booking (User accepts therapist's proposed time)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 */
router.post("/:id/accept-reschedule", authenticate, async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      throw new NotFoundError("Booking not found");
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!existingBooking) {
      throw new NotFoundError("Booking not found");
    }

    // Verify this booking belongs to this user
    if (req.user.type !== USER_TYPES.USER || existingBooking.user_id !== req.user.id) {
      throw new ForbiddenError("Only the booking user can accept reschedule");
    }

    if (existingBooking.status !== BOOKING_STATUS.RESCHEDULED) {
      throw new BadRequestError("This booking is not in rescheduled status");
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BOOKING_STATUS.CONFIRMED,
        confirmed_at: new Date(),
      },
    });

    res.json(successResponse(booking, "Rescheduled booking accepted and confirmed"));
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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 */
router.post("/:id/cancel", authenticate, async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      throw new NotFoundError("Booking not found");
    }

    const { reason } = req.body;

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!existingBooking) {
      throw new NotFoundError("Booking not found");
    }

    // Verify authorization
    const isTherapist = req.user.type === USER_TYPES.THERAPIST && existingBooking.therapist_id === req.user.id;
    const isUser = req.user.type === USER_TYPES.USER && existingBooking.user_id === req.user.id;
    const isAdmin = req.user.type === USER_TYPES.ADMIN;

    if (!isTherapist && !isUser && !isAdmin) {
      throw new ForbiddenError("You can only cancel your own bookings");
    }

    if (existingBooking.status === BOOKING_STATUS.COMPLETED || existingBooking.status === BOOKING_STATUS.CANCELLED) {
      throw new BadRequestError(`Cannot cancel a booking with status: ${existingBooking.status}`);
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BOOKING_STATUS.CANCELLED,
        cancelled_at: new Date(),
        cancellation_reason: reason,
        cancelled_by: req.user.type,
      },
    });

    res.json(successResponse(booking, "Booking cancelled successfully"));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/bookings/{id}/complete:
 *   post:
 *     summary: Mark booking as completed (Therapist only, after session ends)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               therapist_notes:
 *                 type: string
 */
router.post("/:id/complete", authenticate, async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      throw new NotFoundError("Booking not found");
    }

    const { therapist_notes } = req.body;

    if (req.user.type !== USER_TYPES.THERAPIST) {
      throw new ForbiddenError("Only therapists can mark bookings as completed");
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!existingBooking) {
      throw new NotFoundError("Booking not found");
    }

    if (existingBooking.therapist_id !== req.user.id) {
      throw new ForbiddenError("You can only complete your own bookings");
    }

    if (existingBooking.status !== BOOKING_STATUS.CONFIRMED) {
      throw new BadRequestError("Only confirmed bookings can be marked as completed");
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BOOKING_STATUS.COMPLETED,
        therapist_notes,
      },
    });

    res.json(successResponse(booking, "Booking marked as completed"));
  } catch (error) {
    next(error);
  }
});

export default router;
