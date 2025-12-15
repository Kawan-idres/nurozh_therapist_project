import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import prisma from "../../config/prisma.js";
import { successResponse, paginatedResponse, buildPaginationResponse, parsePaginationParams } from "../../utils/helpers.js";
import { NotFoundError } from "../../utils/errors.js";
import { HTTP_STATUS, USER_TYPES } from "../../config/constants.js";

const router = Router();

/**
 * @swagger
 * /api/v1/conversations:
 *   get:
 *     summary: Get conversations
 *     tags: [Conversations]
 *     security:
 *       - BearerAuth: []
 */
router.get("/", authenticate, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    let where = { is_active: true };

    if (req.user.type === USER_TYPES.USER) {
      where.user_id = req.user.id;
    } else if (req.user.type === USER_TYPES.THERAPIST) {
      where.therapist_id = req.user.id;
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({ where, skip, take: limit, orderBy: { last_message_at: "desc" } }),
      prisma.conversation.count({ where }),
    ]);

    const pagination = buildPaginationResponse(page, limit, total);
    res.json(paginatedResponse(conversations, pagination));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/conversations/{id}/messages:
 *   get:
 *     summary: Get messages in a conversation
 *     tags: [Conversations]
 *     security:
 *       - BearerAuth: []
 */
router.get("/:id/messages", authenticate, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversation_id: req.params.id, deleted_at: null },
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.message.count({ where: { conversation_id: req.params.id, deleted_at: null } }),
    ]);

    const pagination = buildPaginationResponse(page, limit, total);
    res.json(paginatedResponse(messages.reverse(), pagination));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/conversations/{id}/messages:
 *   post:
 *     summary: Send a message
 *     tags: [Conversations]
 *     security:
 *       - BearerAuth: []
 */
router.post("/:id/messages", authenticate, async (req, res, next) => {
  try {
    const { content, message_type } = req.body;

    const message = await prisma.message.create({
      data: {
        conversation_id: req.params.id,
        sender_type: req.user.type,
        sender_id: req.user.id,
        content,
        message_type: message_type || "text",
      },
    });

    // Update conversation last message time
    await prisma.conversation.update({
      where: { id: req.params.id },
      data: { last_message_at: new Date() },
    });

    res.status(HTTP_STATUS.CREATED).json(successResponse(message));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/conversations:
 *   post:
 *     summary: Create or get conversation
 *     tags: [Conversations]
 *     security:
 *       - BearerAuth: []
 */
router.post("/", authenticate, async (req, res, next) => {
  try {
    const { therapist_id, user_id } = req.body;
    const finalUserId = req.user.type === USER_TYPES.USER ? req.user.id : user_id;
    const finalTherapistId = req.user.type === USER_TYPES.THERAPIST ? req.user.id : therapist_id;

    let conversation = await prisma.conversation.findFirst({
      where: { user_id: finalUserId, therapist_id: finalTherapistId },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { user_id: finalUserId, therapist_id: finalTherapistId, is_active: true },
      });
    }

    res.json(successResponse(conversation));
  } catch (error) {
    next(error);
  }
});

export default router;
