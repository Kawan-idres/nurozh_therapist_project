import { Router } from "express";
import { authenticate, adminOnly } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
import prisma from "../../config/prisma.js";
import { successResponse, paginatedResponse, buildPaginationResponse, parsePaginationParams, sanitizeTherapist } from "../../utils/helpers.js";
import { NotFoundError, BadRequestError } from "../../utils/errors.js";
import { HTTP_STATUS, THERAPIST_STATUS, USER_TYPES } from "../../config/constants.js";

const router = Router();

/**
 * @swagger
 * /api/v1/therapists:
 *   get:
 *     summary: Get all approved therapists with filters
 *     description: Returns a paginated list of approved therapists. Supports filtering by specialty, language, price range, experience, and gender.
 *     tags: [Therapists]
 *     parameters:
 *       - in: query
 *         name: specialty_id
 *         schema:
 *           type: integer
 *         description: Filter by specialty ID
 *         example: 1
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by spoken language (e.g., en, ar, ku)
 *         example: en
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Minimum session rate
 *         example: 50
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Maximum session rate
 *         example: 150
 *       - in: query
 *         name: min_experience
 *         schema:
 *           type: integer
 *         description: Minimum years of experience
 *         example: 3
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, other]
 *         description: Filter by therapist gender
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name
 *         example: John
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of therapists retrieved successfully
 */
router.get("/", async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { specialty_id, language, min_price, max_price, min_experience, gender, search } = req.query;

    // Base filter: only approved and not deleted
    let where = {
      deleted_at: null,
      status: THERAPIST_STATUS.APPROVED,
    };

    // Filter by minimum experience
    if (min_experience) {
      where.years_of_experience = {
        gte: parseInt(min_experience),
      };
    }

    // Filter by gender
    if (gender) {
      where.gender = gender;
    }

    // Filter by price range
    if (min_price || max_price) {
      where.session_rate_amount = {};
      if (min_price) {
        where.session_rate_amount.gte = parseFloat(min_price);
      }
      if (max_price) {
        where.session_rate_amount.lte = parseFloat(max_price);
      }
    }

    // Search by name
    if (search) {
      where.OR = [
        { first_name: { contains: search } },
        { last_name: { contains: search } },
      ];
    }

    // Get therapists
    let therapists = await prisma.therapist.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
    });

    // Filter by specialty (need to query therapist_specialties)
    if (specialty_id) {
      const specialtyIdInt = parseInt(specialty_id, 10);
      const therapistSpecialties = await prisma.therapistSpecialty.findMany({
        where: { specialty_id: specialtyIdInt },
        select: { therapist_id: true },
      });
      const therapistIdsWithSpecialty = therapistSpecialties.map(ts => ts.therapist_id);
      therapists = therapists.filter(t => therapistIdsWithSpecialty.includes(t.id));
    }

    // Filter by language (spoken_languages is JSON array in MySQL)
    if (language) {
      therapists = therapists.filter(t => {
        if (!t.spoken_languages) return false;
        // spoken_languages is stored as JSON array
        const languages = Array.isArray(t.spoken_languages) ? t.spoken_languages : [];
        return languages.includes(language);
      });
    }

    // Get total count (approximation after in-memory filters)
    const total = therapists.length;

    // Get specialties for each therapist
    const therapistIds = therapists.map(t => t.id);
    const specialtiesMap = {};

    if (therapistIds.length > 0) {
      const therapistSpecialties = await prisma.therapistSpecialty.findMany({
        where: { therapist_id: { in: therapistIds } },
      });

      const specialtyIds = [...new Set(therapistSpecialties.map(ts => ts.specialty_id))];
      const specialties = await prisma.specialty.findMany({
        where: { id: { in: specialtyIds } },
      });

      const specialtiesById = {};
      specialties.forEach(s => { specialtiesById[s.id] = s; });

      therapistSpecialties.forEach(ts => {
        if (!specialtiesMap[ts.therapist_id]) {
          specialtiesMap[ts.therapist_id] = [];
        }
        if (specialtiesById[ts.specialty_id]) {
          specialtiesMap[ts.therapist_id].push(specialtiesById[ts.specialty_id]);
        }
      });
    }

    // Sanitize and add specialties to response
    const sanitized = therapists.map(t => ({
      ...sanitizeTherapist(t),
      specialties: specialtiesMap[t.id] || [],
    }));

    const pagination = buildPaginationResponse(page, limit, total);

    res.json(paginatedResponse(sanitized, pagination));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/therapists/{id}:
 *   get:
 *     summary: Get therapist by ID with full profile
 *     description: Retrieves a therapist's full profile including specialties and availability
 *     tags: [Therapists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Therapist ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Therapist profile retrieved successfully
 *       404:
 *         description: Therapist not found
 */
router.get("/:id", async (req, res, next) => {
  try {
    const therapistId = parseInt(req.params.id, 10);
    if (isNaN(therapistId)) {
      throw new NotFoundError("Therapist not found");
    }

    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId },
    });

    if (!therapist || therapist.deleted_at) {
      throw new NotFoundError("Therapist not found");
    }

    // Get therapist's specialties
    const therapistSpecialties = await prisma.therapistSpecialty.findMany({
      where: { therapist_id: therapist.id },
    });
    const specialtyIds = therapistSpecialties.map(ts => ts.specialty_id);
    const specialties = await prisma.specialty.findMany({
      where: { id: { in: specialtyIds } },
    });

    // Get therapist's availability
    const availability = await prisma.therapistAvailability.findMany({
      where: { therapist_id: therapist.id, is_active: true },
      orderBy: { day_of_week: "asc" },
    });

    const response = {
      ...sanitizeTherapist(therapist),
      specialties,
      availability,
    };

    res.json(successResponse(response));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/therapists/{id}/availability:
 *   get:
 *     summary: Get therapist's availability schedule
 *     description: Retrieves a therapist's weekly availability and any exceptions for the next 30 days
 *     tags: [Therapists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Therapist ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Availability retrieved successfully
 *       404:
 *         description: Therapist not found
 */
router.get("/:id/availability", async (req, res, next) => {
  try {
    const therapistId = parseInt(req.params.id, 10);
    if (isNaN(therapistId)) {
      throw new NotFoundError("Therapist not found");
    }

    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId },
    });

    if (!therapist || therapist.deleted_at) {
      throw new NotFoundError("Therapist not found");
    }

    const availability = await prisma.therapistAvailability.findMany({
      where: { therapist_id: therapistId, is_active: true },
      orderBy: { day_of_week: "asc" },
    });

    // Get availability exceptions (next 30 days)
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const exceptions = await prisma.therapistAvailabilityException.findMany({
      where: {
        therapist_id: therapistId,
        exception_date: {
          gte: today,
          lte: thirtyDaysLater,
        },
      },
      orderBy: { exception_date: "asc" },
    });

    res.json(successResponse({ availability, exceptions }));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/therapists/me/availability:
 *   put:
 *     summary: Update therapist's own availability (Therapist only)
 *     tags: [Therapists]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               availability:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day_of_week:
 *                       type: string
 *                       enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *                     start_time:
 *                       type: string
 *                       format: time
 *                     end_time:
 *                       type: string
 *                       format: time
 *                     is_active:
 *                       type: boolean
 */
router.put("/me/availability", authenticate, async (req, res, next) => {
  try {
    if (req.user.type !== USER_TYPES.THERAPIST) {
      throw new BadRequestError("Only therapists can update availability");
    }

    const { availability } = req.body;

    if (!Array.isArray(availability)) {
      throw new BadRequestError("Availability must be an array");
    }

    // Delete existing availability and recreate
    await prisma.therapistAvailability.deleteMany({
      where: { therapist_id: req.user.id },
    });

    // Create new availability entries
    const newAvailability = await Promise.all(
      availability.map(slot =>
        prisma.therapistAvailability.create({
          data: {
            therapist_id: req.user.id,
            day_of_week: slot.day_of_week,
            start_time: new Date(`1970-01-01T${slot.start_time}`),
            end_time: new Date(`1970-01-01T${slot.end_time}`),
            is_active: slot.is_active !== false,
          },
        })
      )
    );

    res.json(successResponse(newAvailability, "Availability updated successfully"));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/therapists/me/availability/exception:
 *   post:
 *     summary: Add availability exception (day off or special hours)
 *     description: Add a day off or special working hours for a specific date
 *     tags: [Therapists]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exception_date
 *             properties:
 *               exception_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-01-20"
 *                 description: The date for the exception
 *               is_available:
 *                 type: boolean
 *                 default: false
 *                 description: Whether therapist is available on this date
 *               start_time:
 *                 type: string
 *                 example: "10:00"
 *                 description: Start time if available (optional)
 *               end_time:
 *                 type: string
 *                 example: "14:00"
 *                 description: End time if available (optional)
 *               reason:
 *                 type: string
 *                 example: "Personal day off"
 *                 description: Reason for the exception
 *     responses:
 *       201:
 *         description: Exception added successfully
 *       400:
 *         description: Only therapists can add availability exceptions
 *       401:
 *         description: Unauthorized
 */
router.post("/me/availability/exception", authenticate, async (req, res, next) => {
  try {
    if (req.user.type !== USER_TYPES.THERAPIST) {
      throw new BadRequestError("Only therapists can add availability exceptions");
    }

    const { exception_date, is_available, start_time, end_time, reason } = req.body;

    const exception = await prisma.therapistAvailabilityException.create({
      data: {
        therapist_id: req.user.id,
        exception_date: new Date(exception_date),
        is_available: is_available || false,
        start_time: start_time ? new Date(`1970-01-01T${start_time}`) : null,
        end_time: end_time ? new Date(`1970-01-01T${end_time}`) : null,
        reason,
      },
    });

    res.status(HTTP_STATUS.CREATED).json(successResponse(exception, "Exception added successfully"));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/therapists/me/clients:
 *   get:
 *     summary: Get therapist's client list (Therapist only)
 *     description: Retrieves a list of all clients who have booked sessions with this therapist
 *     tags: [Therapists]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Client list retrieved successfully
 *       400:
 *         description: Only therapists can view their clients
 *       401:
 *         description: Unauthorized
 */
router.get("/me/clients", authenticate, async (req, res, next) => {
  try {
    if (req.user.type !== USER_TYPES.THERAPIST) {
      throw new BadRequestError("Only therapists can view their clients");
    }

    const { page, limit, skip } = parsePaginationParams(req.query);

    // Get unique user IDs from bookings
    const bookings = await prisma.booking.findMany({
      where: { therapist_id: req.user.id },
      select: { user_id: true },
      distinct: ["user_id"],
    });

    const userIds = bookings.map(b => b.user_id);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds }, deleted_at: null },
        skip,
        take: limit,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
          avatar_url: true,
          gender: true,
          date_of_birth: true,
          created_at: true,
        },
      }),
      prisma.user.count({ where: { id: { in: userIds }, deleted_at: null } }),
    ]);

    const pagination = buildPaginationResponse(page, limit, total);
    res.json(paginatedResponse(users, pagination));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/therapists/{id}/approve:
 *   post:
 *     summary: Approve therapist (Admin only)
 *     description: Approves a pending therapist application
 *     tags: [Therapists]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Therapist ID to approve
 *         example: 1
 *     responses:
 *       200:
 *         description: Therapist approved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Therapist not found
 */
router.post("/:id/approve", authenticate, authorize("therapists:approve"), async (req, res, next) => {
  try {
    const therapistId = parseInt(req.params.id, 10);
    if (isNaN(therapistId)) {
      throw new NotFoundError("Therapist not found");
    }

    const therapist = await prisma.therapist.update({
      where: { id: therapistId },
      data: {
        status: THERAPIST_STATUS.APPROVED,
        approved_by: req.user.id,
        approved_at: new Date(),
      },
    });

    res.json(successResponse(sanitizeTherapist(therapist), "Therapist approved successfully"));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/therapists/{id}/reject:
 *   post:
 *     summary: Reject therapist (Admin only)
 *     description: Rejects a pending therapist application
 *     tags: [Therapists]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Therapist ID to reject
 *         example: 1
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Incomplete documentation"
 *                 description: Reason for rejection (optional)
 *     responses:
 *       200:
 *         description: Therapist rejected successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Therapist not found
 */
router.post("/:id/reject", authenticate, authorize("therapists:approve"), async (req, res, next) => {
  try {
    const therapistId = parseInt(req.params.id, 10);
    if (isNaN(therapistId)) {
      throw new NotFoundError("Therapist not found");
    }

    const { reason } = req.body;

    const therapist = await prisma.therapist.update({
      where: { id: therapistId },
      data: { status: THERAPIST_STATUS.REJECTED },
    });

    res.json(successResponse(sanitizeTherapist(therapist), "Therapist rejected"));
  } catch (error) {
    next(error);
  }
});

export default router;
