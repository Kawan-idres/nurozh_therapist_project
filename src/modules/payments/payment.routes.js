import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
import prisma from "../../config/prisma.js";
import { successResponse, paginatedResponse, buildPaginationResponse, parsePaginationParams } from "../../utils/helpers.js";
import { NotFoundError } from "../../utils/errors.js";
import { HTTP_STATUS, PAYMENT_STATUS, USER_TYPES } from "../../config/constants.js";

const router = Router();

/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: Get payments
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 */
router.get("/", authenticate, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    let where = {};

    if (req.user.type === USER_TYPES.USER) {
      where.user_id = req.user.id;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({ where, skip, take: limit, orderBy: { created_at: "desc" } }),
      prisma.payment.count({ where }),
    ]);

    const pagination = buildPaginationResponse(page, limit, total);
    res.json(paginatedResponse(payments, pagination));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 */
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const paymentId = parseInt(req.params.id, 10);
    if (isNaN(paymentId)) {
      throw new NotFoundError("Payment not found");
    }

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundError("Payment not found");
    res.json(successResponse(payment));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/payments:
 *   post:
 *     summary: Create a payment
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 */
router.post("/", authenticate, authorize("payments:create"), async (req, res, next) => {
  try {
    const { booking_id, amount, currency } = req.body;

    const bookingIdInt = parseInt(booking_id, 10);
    if (isNaN(bookingIdInt)) {
      throw new NotFoundError("Invalid booking ID");
    }

    const payment = await prisma.payment.create({
      data: {
        booking_id: bookingIdInt,
        user_id: req.user.id,
        amount,
        currency: currency || "USD",
        status: PAYMENT_STATUS.PENDING,
      },
    });

    res.status(HTTP_STATUS.CREATED).json(successResponse(payment, "Payment created"));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/payments/webhook:
 *   post:
 *     summary: Payment webhook handler
 *     tags: [Payments]
 */
router.post("/webhook", async (req, res, next) => {
  try {
    // Log webhook
    await prisma.webhookLog.create({
      data: {
        source: "payment_provider",
        event_type: req.body.event,
        headers: req.headers,
        payload: req.body,
      },
    });

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

export default router;
