import { Router } from "express";
import { authenticate, adminOnly } from "../../middleware/auth.js";
import { authorize, PERMISSIONS } from "../../middleware/rbac.js";
import prisma from "../../config/prisma.js";
import { successResponse, paginatedResponse, buildPaginationResponse, parsePaginationParams, sanitizeTherapist } from "../../utils/helpers.js";
import { NotFoundError } from "../../utils/errors.js";
import { HTTP_STATUS, THERAPIST_STATUS } from "../../config/constants.js";

const router = Router();

/**
 * @swagger
 * /api/v1/therapists:
 *   get:
 *     summary: Get all therapists (public for approved, all for admin)
 *     tags: [Therapists]
 */
router.get("/", async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    const where = { deleted_at: null, status: THERAPIST_STATUS.APPROVED };

    const [therapists, total] = await Promise.all([
      prisma.therapist.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.therapist.count({ where }),
    ]);

    const sanitized = therapists.map(sanitizeTherapist);
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
 *     summary: Get therapist by ID
 *     tags: [Therapists]
 */
router.get("/:id", async (req, res, next) => {
  try {
    const therapist = await prisma.therapist.findUnique({
      where: { id: req.params.id },
    });

    if (!therapist || therapist.deleted_at) {
      throw new NotFoundError("Therapist not found");
    }

    res.json(successResponse(sanitizeTherapist(therapist)));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/therapists/{id}/approve:
 *   post:
 *     summary: Approve therapist (Admin only)
 *     tags: [Therapists]
 *     security:
 *       - BearerAuth: []
 */
router.post("/:id/approve", authenticate, authorize(PERMISSIONS.THERAPISTS_APPROVE), async (req, res, next) => {
  try {
    const therapist = await prisma.therapist.update({
      where: { id: req.params.id },
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
 *     tags: [Therapists]
 *     security:
 *       - BearerAuth: []
 */
router.post("/:id/reject", authenticate, authorize(PERMISSIONS.THERAPISTS_APPROVE), async (req, res, next) => {
  try {
    const therapist = await prisma.therapist.update({
      where: { id: req.params.id },
      data: { status: THERAPIST_STATUS.REJECTED },
    });

    res.json(successResponse(sanitizeTherapist(therapist), "Therapist rejected"));
  } catch (error) {
    next(error);
  }
});

export default router;
