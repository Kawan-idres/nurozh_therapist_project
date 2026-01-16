import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
import prisma from "../../config/prisma.js";
import { successResponse, paginatedResponse, buildPaginationResponse, parsePaginationParams } from "../../utils/helpers.js";
import { NotFoundError, BadRequestError, ForbiddenError } from "../../utils/errors.js";
import { HTTP_STATUS, BOOKING_STATUS, USER_TYPES, FREE_SESSION_CONFIG, DEFAULTS, THERAPIST_STATUS } from "../../config/constants.js";

const router = Router();

/**
 * Helper to sanitize user data for response
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
};

/**
 * Helper to sanitize therapist data for response
 */
const sanitizeTherapist = (therapist) => {
  if (!therapist) return null;
  const { password_hash, ...safe } = therapist;
  return safe;
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         user_id:
 *           type: integer
 *           example: 3
 *         therapist_id:
 *           type: integer
 *           example: 5
 *         session_type:
 *           type: string
 *           enum: [video, audio, chat]
 *           example: video
 *         scheduled_start:
 *           type: string
 *           format: date-time
 *           example: "2026-01-20T10:00:00Z"
 *         scheduled_end:
 *           type: string
 *           format: date-time
 *           example: "2026-01-20T10:50:00Z"
 *         duration_minutes:
 *           type: integer
 *           example: 50
 *         status:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled, no_show, rescheduled]
 *           example: pending
 *         is_free_session:
 *           type: boolean
 *           example: true
 *         amount:
 *           type: number
 *           example: 75.00
 *         currency:
 *           type: string
 *           example: USD
 *         user_notes:
 *           type: string
 *           example: "I've been feeling anxious lately"
 *         therapist_notes:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     summary: Get bookings
 *     description: |
 *       - Users see their own bookings
 *       - Therapists see bookings assigned to them
 *       - Admins can see all bookings (with optional filters)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled, no_show, rescheduled]
 *         description: Filter by booking status
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID (admin only)
 *       - in: query
 *         name: therapist_id
 *         schema:
 *           type: integer
 *         description: Filter by therapist ID (admin only)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { status, user_id, therapist_id } = req.query;

    let where = {};

    // Filter by user type
    if (req.user.type === USER_TYPES.USER) {
      where.user_id = req.user.id;
    } else if (req.user.type === USER_TYPES.THERAPIST) {
      where.therapist_id = req.user.id;
    } else if (req.user.type === USER_TYPES.ADMIN) {
      // Admin can filter by user_id or therapist_id
      if (user_id) where.user_id = parseInt(user_id, 10);
      if (therapist_id) where.therapist_id = parseInt(therapist_id, 10);
    }

    // Filter by status if provided
    if (status) {
      if (!Object.values(BOOKING_STATUS).includes(status)) {
        throw new BadRequestError(`Invalid status. Must be one of: ${Object.values(BOOKING_STATUS).join(", ")}`);
      }
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduled_start: "desc" },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              avatar_url: true,
            },
          },
          therapist: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              avatar_url: true,
              title: true,
              specialties: {
                include: {
                  specialty: true,
                },
              },
            },
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
 * /api/v1/bookings:
 *   post:
 *     summary: Create a new booking (User only)
 *     description: Users can book sessions with therapists. First session is free (30 minutes).
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
 *                 type: integer
 *                 description: ID of the therapist to book
 *                 example: 5
 *               session_type:
 *                 type: string
 *                 enum: [video, audio, chat]
 *                 description: Type of session
 *                 example: video
 *               scheduled_start:
 *                 type: string
 *                 format: date-time
 *                 description: Start time of the session (must be in the future)
 *                 example: "2026-01-20T10:00:00Z"
 *               user_notes:
 *                 type: string
 *                 description: Optional notes for the therapist
 *                 example: "I've been feeling anxious about work"
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Booking created successfully. Waiting for therapist confirmation."
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request - Invalid data or scheduling conflict
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only users can create bookings
 *       404:
 *         description: Therapist not found
 */
router.post("/", authenticate, async (req, res, next) => {
  try {
    // Only users (patients) can create bookings
    if (req.user.type !== USER_TYPES.USER) {
      throw new ForbiddenError("Only patients can create bookings");
    }

    const { therapist_id, session_type, scheduled_start, user_notes } = req.body;

    // Validate required fields
    if (!therapist_id) {
      throw new BadRequestError("Therapist ID is required");
    }
    if (!session_type) {
      throw new BadRequestError("Session type is required");
    }
    if (!scheduled_start) {
      throw new BadRequestError("Scheduled start time is required");
    }

    // Validate session_type
    const validSessionTypes = ["video", "audio", "chat"];
    if (!validSessionTypes.includes(session_type)) {
      throw new BadRequestError(`Invalid session type. Must be one of: ${validSessionTypes.join(", ")}`);
    }

    const therapistIdInt = parseInt(therapist_id, 10);
    if (isNaN(therapistIdInt)) {
      throw new BadRequestError("Invalid therapist ID");
    }

    // Validate scheduled_start is in the future
    const startDate = new Date(scheduled_start);
    if (isNaN(startDate.getTime())) {
      throw new BadRequestError("Invalid scheduled start time format");
    }
    if (startDate <= new Date()) {
      throw new BadRequestError("Scheduled start time must be in the future");
    }

    // Get the user to check free session status
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Get the therapist and verify they're approved
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistIdInt },
    });

    if (!therapist) {
      throw new NotFoundError("Therapist not found");
    }

    if (therapist.status !== THERAPIST_STATUS.APPROVED) {
      throw new BadRequestError("This therapist is not available for bookings");
    }

    if (therapist.deleted_at) {
      throw new NotFoundError("Therapist not found");
    }

    // Check for scheduling conflicts (therapist already has a booking at this time)
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        therapist_id: therapistIdInt,
        status: { in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
        OR: [
          {
            AND: [
              { scheduled_start: { lte: startDate } },
              { scheduled_end: { gt: startDate } },
            ],
          },
        ],
      },
    });

    if (conflictingBooking) {
      throw new BadRequestError("This time slot is not available. Please choose a different time.");
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
      amount = therapist.session_rate_amount || 0;
    }

    // Calculate scheduled_end
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
      include: {
        therapist: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            title: true,
          },
        },
      },
    });

    const message = is_free_session
      ? "Free session booking created successfully. Waiting for therapist confirmation."
      : "Booking created successfully. Waiting for therapist confirmation.";

    res.status(HTTP_STATUS.CREATED).json(successResponse(booking, message));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     description: Get detailed information about a specific booking
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Can only view your own bookings
 *       404:
 *         description: Booking not found
 */
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      throw new BadRequestError("Invalid booking ID");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            avatar_url: true,
            phone: true,
          },
        },
        therapist: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            avatar_url: true,
            title: true,
            bio: true,
            session_rate_amount: true,
            session_rate_currency: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    // Check authorization
    const isOwner = req.user.type === USER_TYPES.USER && booking.user_id === req.user.id;
    const isTherapist = req.user.type === USER_TYPES.THERAPIST && booking.therapist_id === req.user.id;
    const isAdmin = req.user.type === USER_TYPES.ADMIN;

    if (!isOwner && !isTherapist && !isAdmin) {
      throw new ForbiddenError("You don't have permission to view this booking");
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
 *     summary: Confirm booking (Therapist only)
 *     description: Therapist accepts and confirms a pending booking request
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Booking confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Booking confirmed successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request - Booking cannot be confirmed (wrong status)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only therapists can confirm their own bookings
 *       404:
 *         description: Booking not found
 */
router.post("/:id/confirm", authenticate, async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      throw new BadRequestError("Invalid booking ID");
    }

    // Only therapists can confirm bookings
    if (req.user.type !== USER_TYPES.THERAPIST) {
      throw new ForbiddenError("Only therapists can confirm bookings");
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!existingBooking) {
      throw new NotFoundError("Booking not found");
    }

    // Verify this booking belongs to this therapist
    if (existingBooking.therapist_id !== req.user.id) {
      throw new ForbiddenError("You can only confirm your own bookings");
    }

    // Check valid status transitions
    const confirmableStatuses = [BOOKING_STATUS.PENDING, BOOKING_STATUS.RESCHEDULED];
    if (!confirmableStatuses.includes(existingBooking.status)) {
      throw new BadRequestError(`Cannot confirm a booking with status: ${existingBooking.status}`);
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BOOKING_STATUS.CONFIRMED,
        confirmed_at: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
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
 *     summary: Reschedule booking
 *     description: |
 *       Both users and therapists can request to reschedule a booking.
 *       After rescheduling, the other party must accept the new time.
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *         example: 1
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
 *                 description: New proposed start time
 *                 example: "2026-01-21T14:00:00Z"
 *               reason:
 *                 type: string
 *                 description: Reason for rescheduling
 *                 example: "I have a conflict at the original time"
 *     responses:
 *       200:
 *         description: Booking rescheduled successfully
 *       400:
 *         description: Bad request - Invalid time or booking cannot be rescheduled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Can only reschedule your own bookings
 *       404:
 *         description: Booking not found
 */
router.post("/:id/reschedule", authenticate, async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      throw new BadRequestError("Invalid booking ID");
    }

    const { new_scheduled_start, reason } = req.body;

    if (!new_scheduled_start) {
      throw new BadRequestError("New scheduled start time is required");
    }

    const newStartDate = new Date(new_scheduled_start);
    if (isNaN(newStartDate.getTime())) {
      throw new BadRequestError("Invalid date format for new scheduled start");
    }

    if (newStartDate <= new Date()) {
      throw new BadRequestError("New scheduled time must be in the future");
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
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

    // Check valid status transitions
    const reschedulableStatuses = [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.RESCHEDULED];
    if (!reschedulableStatuses.includes(existingBooking.status)) {
      throw new BadRequestError(`Cannot reschedule a booking with status: ${existingBooking.status}`);
    }

    // Calculate new end time based on existing duration
    const newEndDate = new Date(newStartDate.getTime() + existingBooking.duration_minutes * 60 * 1000);

    // Track who requested the reschedule
    const rescheduled_by = req.user.type;

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BOOKING_STATUS.RESCHEDULED,
        scheduled_start: newStartDate,
        scheduled_end: newEndDate,
        reschedule_reason: reason,
        rescheduled_at: new Date(),
        rescheduled_by,
        // Reset confirmation - needs to be confirmed again after reschedule
        confirmed_at: null,
      },
      include: {
        user: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        therapist: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
    });

    const otherParty = isUser ? "therapist" : "user";
    res.json(successResponse(booking, `Booking rescheduled successfully. Waiting for ${otherParty} confirmation.`));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/bookings/{id}/accept-reschedule:
 *   post:
 *     summary: Accept rescheduled booking
 *     description: |
 *       Accept a booking that was rescheduled by the other party.
 *       - If therapist rescheduled, user accepts
 *       - If user rescheduled, therapist accepts
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Rescheduled booking accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Rescheduled booking accepted and confirmed"
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request - Booking is not in rescheduled status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot accept your own reschedule request
 *       404:
 *         description: Booking not found
 */
router.post("/:id/accept-reschedule", authenticate, async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      throw new BadRequestError("Invalid booking ID");
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!existingBooking) {
      throw new NotFoundError("Booking not found");
    }

    if (existingBooking.status !== BOOKING_STATUS.RESCHEDULED) {
      throw new BadRequestError("This booking is not in rescheduled status");
    }

    // Determine who can accept based on who rescheduled
    const isUser = req.user.type === USER_TYPES.USER && existingBooking.user_id === req.user.id;
    const isTherapist = req.user.type === USER_TYPES.THERAPIST && existingBooking.therapist_id === req.user.id;

    if (!isUser && !isTherapist) {
      throw new ForbiddenError("You don't have permission to accept this reschedule");
    }

    // The person who rescheduled cannot accept their own reschedule
    if (existingBooking.rescheduled_by === req.user.type) {
      throw new BadRequestError("You cannot accept your own reschedule request. The other party must accept.");
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BOOKING_STATUS.CONFIRMED,
        confirmed_at: new Date(),
      },
      include: {
        user: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        therapist: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
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
 *     description: |
 *       Cancel a booking. Can be done by user, therapist, or admin.
 *       If a free session is cancelled before it's completed, the user's free session is restored.
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *         example: 1
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *                 example: "Schedule conflict"
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Bad request - Booking cannot be cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Can only cancel your own bookings
 *       404:
 *         description: Booking not found
 */
router.post("/:id/cancel", authenticate, async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      throw new BadRequestError("Invalid booking ID");
    }

    const { reason } = req.body;

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!existingBooking) {
      throw new NotFoundError("Booking not found");
    }

    // Verify authorization
    const isTherapist = req.user.type === USER_TYPES.THERAPIST && existingBooking.therapist_id === req.user.id;
    const isUser = req.user.type === USER_TYPES.USER && existingBooking.user_id === req.user.id;
    const isAdmin = req.user.type === USER_TYPES.ADMIN;

    if (!isTherapist && !isUser && !isAdmin) {
      throw new ForbiddenError("You don't have permission to cancel this booking");
    }

    // Check valid status transitions
    const cancellableStatuses = [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.RESCHEDULED];
    if (!cancellableStatuses.includes(existingBooking.status)) {
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

    // If this was a free session that was confirmed but not completed, restore user's free session
    if (existingBooking.is_free_session && existingBooking.status === BOOKING_STATUS.CONFIRMED) {
      await prisma.user.update({
        where: { id: existingBooking.user_id },
        data: { free_session_used: false },
      });
    }

    res.json(successResponse(booking, "Booking cancelled successfully"));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/bookings/{id}/complete:
 *   post:
 *     summary: Mark booking as completed (Therapist only)
 *     description: Therapist marks a confirmed booking as completed after the session ends
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *         example: 1
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               therapist_notes:
 *                 type: string
 *                 description: Private notes for the therapist about the session
 *                 example: "Patient showed improvement in anxiety management"
 *     responses:
 *       200:
 *         description: Booking marked as completed
 *       400:
 *         description: Bad request - Only confirmed bookings can be completed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only therapists can complete their own bookings
 *       404:
 *         description: Booking not found
 */
router.post("/:id/complete", authenticate, async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      throw new BadRequestError("Invalid booking ID");
    }

    const { therapist_notes } = req.body;

    if (req.user.type !== USER_TYPES.THERAPIST) {
      throw new ForbiddenError("Only therapists can mark bookings as completed");
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
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
        completed_at: new Date(),
      },
    });

    res.json(successResponse(booking, "Booking marked as completed"));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/bookings/{id}/no-show:
 *   post:
 *     summary: Mark booking as no-show (Therapist only)
 *     description: Therapist marks a confirmed booking as no-show when the patient doesn't attend
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *         example: 1
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Notes about the no-show
 *                 example: "Patient did not join the video call"
 *     responses:
 *       200:
 *         description: Booking marked as no-show
 *       400:
 *         description: Bad request - Only confirmed bookings can be marked as no-show
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only therapists can mark their own bookings as no-show
 *       404:
 *         description: Booking not found
 */
router.post("/:id/no-show", authenticate, async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      throw new BadRequestError("Invalid booking ID");
    }

    const { notes } = req.body;

    if (req.user.type !== USER_TYPES.THERAPIST) {
      throw new ForbiddenError("Only therapists can mark bookings as no-show");
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!existingBooking) {
      throw new NotFoundError("Booking not found");
    }

    if (existingBooking.therapist_id !== req.user.id) {
      throw new ForbiddenError("You can only mark your own bookings as no-show");
    }

    if (existingBooking.status !== BOOKING_STATUS.CONFIRMED) {
      throw new BadRequestError("Only confirmed bookings can be marked as no-show");
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BOOKING_STATUS.NO_SHOW,
        therapist_notes: notes,
      },
    });

    // Note: For no-show, the free session is NOT restored (user forfeited it)

    res.json(successResponse(booking, "Booking marked as no-show"));
  } catch (error) {
    next(error);
  }
});

export default router;
