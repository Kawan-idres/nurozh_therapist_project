import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
import prisma from "../../config/prisma.js";
import { successResponse, paginatedResponse, buildPaginationResponse, parsePaginationParams } from "../../utils/helpers.js";
import { NotFoundError } from "../../utils/errors.js";
import { HTTP_STATUS, SUBSCRIPTION_STATUS, USER_TYPES } from "../../config/constants.js";

const router = Router();

/**
 * @swagger
 * /api/v1/subscriptions:
 *   get:
 *     summary: Get subscriptions
 *     tags: [Subscriptions]
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

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({ where, skip, take: limit, orderBy: { created_at: "desc" } }),
      prisma.subscription.count({ where }),
    ]);

    const pagination = buildPaginationResponse(page, limit, total);
    res.json(paginatedResponse(subscriptions, pagination));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/subscriptions:
 *   post:
 *     summary: Create subscription
 *     tags: [Subscriptions]
 *     security:
 *       - BearerAuth: []
 */
router.post("/", authenticate, authorize("subscriptions:create"), async (req, res, next) => {
  try {
    const { therapist_id, type, amount, currency } = req.body;

    const therapistIdInt = parseInt(therapist_id, 10);
    if (isNaN(therapistIdInt)) {
      throw new NotFoundError("Invalid therapist ID");
    }

    const subscription = await prisma.subscription.create({
      data: {
        user_id: req.user.id,
        therapist_id: therapistIdInt,
        type,
        amount,
        currency,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        started_at: new Date(),
        renews_at: new Date(Date.now() + (type === "weekly" ? 7 : 30) * 24 * 60 * 60 * 1000),
      },
    });

    res.status(HTTP_STATUS.CREATED).json(successResponse(subscription, "Subscription created"));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/subscriptions/{id}:
 *   get:
 *     summary: Get subscription by ID
 *     tags: [Subscriptions]
 *     security:
 *       - BearerAuth: []
 */
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const subscriptionId = parseInt(req.params.id, 10);
    if (isNaN(subscriptionId)) {
      throw new NotFoundError("Subscription not found");
    }

    const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!subscription) throw new NotFoundError("Subscription not found");
    res.json(successResponse(subscription));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/subscriptions/{id}/cancel:
 *   post:
 *     summary: Cancel subscription
 *     tags: [Subscriptions]
 *     security:
 *       - BearerAuth: []
 */
router.post("/:id/cancel", authenticate, async (req, res, next) => {
  try {
    const subscriptionId = parseInt(req.params.id, 10);
    if (isNaN(subscriptionId)) {
      throw new NotFoundError("Subscription not found");
    }

    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: SUBSCRIPTION_STATUS.CANCELLED, cancelled_at: new Date() },
    });
    res.json(successResponse(subscription, "Subscription cancelled"));
  } catch (error) {
    next(error);
  }
});

export default router;
