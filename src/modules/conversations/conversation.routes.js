import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import prisma from "../../config/prisma.js";
import { successResponse, paginatedResponse, buildPaginationResponse, parsePaginationParams } from "../../utils/helpers.js";
import { NotFoundError, ForbiddenError, BadRequestError } from "../../utils/errors.js";
import { HTTP_STATUS, USER_TYPES, THERAPIST_STATUS } from "../../config/constants.js";
import {
  checkConversationAccess,
  checkTherapistRelationship,
  formatConversationResponse,
  getSenderDetails,
  getUnreadCount,
} from "./conversation.helpers.js";
import {
  createConversationSchema,
  sendMessageSchema,
  getMessagesSchema,
  getConversationSchema,
  markReadSchema,
  deleteMessageSchema,
} from "./conversation.schema.js";
import { getIO } from "../../socket/index.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Conversation:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 3
 *             first_name:
 *               type: string
 *               example: "John"
 *             last_name:
 *               type: string
 *               example: "Doe"
 *             avatar_url:
 *               type: string
 *               example: "https://example.com/avatar.jpg"
 *         therapist:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 5
 *             first_name:
 *               type: string
 *               example: "Sarah"
 *             last_name:
 *               type: string
 *               example: "Smith"
 *             avatar_url:
 *               type: string
 *               example: "https://example.com/avatar.jpg"
 *             title:
 *               type: object
 *               example: { "en": "Licensed Therapist" }
 *         is_active:
 *           type: boolean
 *           example: true
 *         unread_count:
 *           type: integer
 *           example: 2
 *         last_message:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             content:
 *               type: string
 *             sender_type:
 *               type: string
 *             created_at:
 *               type: string
 *               format: date-time
 *         last_message_at:
 *           type: string
 *           format: date-time
 *         created_at:
 *           type: string
 *           format: date-time
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 45
 *         conversation_id:
 *           type: integer
 *           example: 1
 *         content:
 *           type: string
 *           example: "Thank you for your help!"
 *         sender_type:
 *           type: string
 *           enum: [user, therapist, system]
 *           example: "user"
 *         sender:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 3
 *             first_name:
 *               type: string
 *               example: "John"
 *             last_name:
 *               type: string
 *               example: "Doe"
 *             avatar_url:
 *               type: string
 *         message_type:
 *           type: string
 *           enum: [text, image, file, system]
 *           example: "text"
 *         created_at:
 *           type: string
 *           format: date-time
 *     UnreadCount:
 *       type: object
 *       properties:
 *         total_unread:
 *           type: integer
 *           example: 5
 *         conversations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               conversation_id:
 *                 type: integer
 *               unread_count:
 *                 type: integer
 */

/**
 * @swagger
 * /api/v1/conversations/unread-count:
 *   get:
 *     summary: Get total unread message count
 *     description: Returns total unread count and per-conversation breakdown. Admins are blocked.
 *     tags: [Conversations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UnreadCount'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admins cannot access messaging
 */
router.get("/unread-count", authenticate, async (req, res, next) => {
  try {
    // Block admins
    if (req.user.type === USER_TYPES.ADMIN) {
      throw new ForbiddenError("Admins cannot access messaging features");
    }

    const where = { is_active: true };
    const role = req.user.type === USER_TYPES.USER ? "user" : "therapist";

    if (req.user.type === USER_TYPES.USER) {
      where.user_id = req.user.id;
    } else if (req.user.type === USER_TYPES.THERAPIST) {
      where.therapist_id = req.user.id;
    }

    const conversations = await prisma.conversation.findMany({
      where,
      select: {
        id: true,
        user_last_read_at: true,
        therapist_last_read_at: true,
      },
    });

    const conversationCounts = await Promise.all(
      conversations.map(async (conv) => ({
        conversation_id: conv.id,
        unread_count: await getUnreadCount(conv, role),
      })),
    );

    const totalUnread = conversationCounts.reduce((sum, c) => sum + c.unread_count, 0);

    res.json(successResponse({
      total_unread: totalUnread,
      conversations: conversationCounts.filter((c) => c.unread_count > 0),
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/conversations:
 *   get:
 *     summary: Get all conversations for current user
 *     description: |
 *       Returns conversations with participant details, unread count, and last message.
 *       - Users see conversations with their therapists
 *       - Therapists see conversations with their clients
 *       - Admins are blocked from accessing this endpoint
 *     tags: [Conversations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *         description: Conversations retrieved successfully
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
 *                     $ref: '#/components/schemas/Conversation'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admins cannot access messaging
 */
router.get("/", authenticate, async (req, res, next) => {
  try {
    // Block admins
    if (req.user.type === USER_TYPES.ADMIN) {
      throw new ForbiddenError("Admins cannot access messaging features");
    }

    const { page, limit, skip } = parsePaginationParams(req.query);
    const where = { is_active: true };
    const role = req.user.type === USER_TYPES.USER ? "user" : "therapist";

    if (req.user.type === USER_TYPES.USER) {
      where.user_id = req.user.id;
    } else if (req.user.type === USER_TYPES.THERAPIST) {
      where.therapist_id = req.user.id;
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { last_message_at: "desc" },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              avatar_url: true,
              email: true,
            },
          },
          therapist: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              avatar_url: true,
              email: true,
              title: true,
            },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    // Format conversations with unread count and last message
    const formattedConversations = await Promise.all(
      conversations.map((conv) => formatConversationResponse(conv, role)),
    );

    const pagination = buildPaginationResponse(page, limit, total);
    res.json(paginatedResponse(formattedConversations, pagination));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/conversations/{id}:
 *   get:
 *     summary: Get a single conversation by ID
 *     description: Returns conversation with participant details, unread count, and last message. Only participants can access.
 *     tags: [Conversations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Conversation ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Conversation'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a participant or admin
 *       404:
 *         description: Conversation not found
 */
router.get("/:id", authenticate, validate(getConversationSchema), async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const { conversation, role } = await checkConversationAccess(conversationId, req);

    const formattedConversation = await formatConversationResponse(conversation, role);
    res.json(successResponse(formattedConversation));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/conversations/{id}/messages:
 *   get:
 *     summary: Get messages in a conversation
 *     description: Returns paginated messages with sender details. Only conversation participants can access.
 *     tags: [Conversations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Conversation ID
 *         example: 1
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
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
 *                     $ref: '#/components/schemas/Message'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a participant or admin
 *       404:
 *         description: Conversation not found
 */
router.get("/:id/messages", authenticate, validate(getMessagesSchema), async (req, res, next) => {
  try {
    const conversationId = req.params.id;

    // Check access
    await checkConversationAccess(conversationId, req);

    const { page, limit, skip } = parsePaginationParams(req.query);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversation_id: conversationId, deleted_at: null },
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.message.count({ where: { conversation_id: conversationId, deleted_at: null } }),
    ]);

    // Add sender details to each message
    const messagesWithSender = await Promise.all(
      messages.map(async (message) => {
        const sender = await getSenderDetails(message.sender_type, message.sender_id);
        return {
          ...message,
          sender,
        };
      }),
    );

    const pagination = buildPaginationResponse(page, limit, total);
    res.json(paginatedResponse(messagesWithSender.reverse(), pagination));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/conversations/{id}/messages:
 *   post:
 *     summary: Send a message in a conversation
 *     description: |
 *       Send a message to a conversation. Only participants can send messages.
 *       - Users can only send to therapists they have bookings with
 *       - Therapists can only send to their clients
 *       - Admins are blocked
 *       - System message type is reserved
 *     tags: [Conversations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Conversation ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content (1-5000 characters)
 *                 example: "Hello, I wanted to discuss..."
 *               message_type:
 *                 type: string
 *                 enum: [text, image, file]
 *                 default: text
 *                 description: Type of message
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Bad request - Invalid content or message type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a participant or admin
 *       404:
 *         description: Conversation not found
 */
router.post("/:id/messages", authenticate, validate(sendMessageSchema), async (req, res, next) => {
  try {
    const conversationId = req.params.id;

    // Check access
    await checkConversationAccess(conversationId, req);

    const { content, message_type } = req.body;

    // Block system message type from users/therapists
    if (message_type === "system") {
      throw new BadRequestError("System message type is reserved");
    }

    const message = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_type: req.user.type,
        sender_id: req.user.id,
        content,
        message_type: message_type || "text",
      },
    });

    // Update conversation last message time
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { last_message_at: new Date() },
    });

    // Get sender details for response
    const sender = await getSenderDetails(req.user.type, req.user.id);

    const messageWithSender = {
      ...message,
      sender,
    };

    // Emit Socket.IO event for real-time updates
    const io = getIO();
    if (io) {
      io.to(`conversation-${conversationId}`).emit("new_message", messageWithSender);
    }

    res.status(HTTP_STATUS.CREATED).json(successResponse(messageWithSender));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/conversations:
 *   post:
 *     summary: Create or get existing conversation
 *     description: |
 *       Create a new conversation or retrieve existing one between user and therapist.
 *       - Users must provide therapist_id and have a booking with them
 *       - Therapists must provide user_id (must be their client)
 *       - Admins are blocked
 *     tags: [Conversations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               therapist_id:
 *                 type: integer
 *                 description: Therapist ID (required for users)
 *                 example: 5
 *               user_id:
 *                 type: integer
 *                 description: User ID (required for therapists)
 *                 example: 3
 *     responses:
 *       200:
 *         description: Conversation created or retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Bad request - Missing required ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or no booking relationship
 *       404:
 *         description: Therapist/User not found
 */
router.post("/", authenticate, validate(createConversationSchema), async (req, res, next) => {
  try {
    // Block admins
    if (req.user.type === USER_TYPES.ADMIN) {
      throw new ForbiddenError("Admins cannot create conversations");
    }

    const { therapist_id, user_id } = req.body;

    let finalUserId = null;
    let finalTherapistId = null;

    if (req.user.type === USER_TYPES.USER) {
      finalUserId = req.user.id;

      if (!therapist_id) {
        throw new BadRequestError("Therapist ID is required");
      }
      finalTherapistId = therapist_id;

      // Verify therapist exists and is approved
      const therapist = await prisma.therapist.findUnique({
        where: { id: finalTherapistId },
      });

      if (!therapist || therapist.deleted_at) {
        throw new NotFoundError("Therapist not found");
      }

      if (therapist.status !== THERAPIST_STATUS.APPROVED) {
        throw new ForbiddenError("Cannot message this therapist");
      }

      // Verify booking relationship
      const hasRelationship = await checkTherapistRelationship(finalUserId, finalTherapistId);
      if (!hasRelationship) {
        throw new ForbiddenError("You must have a booking with this therapist to start a conversation");
      }

    } else if (req.user.type === USER_TYPES.THERAPIST) {
      finalTherapistId = req.user.id;

      if (!user_id) {
        throw new BadRequestError("User ID is required");
      }
      finalUserId = user_id;

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: finalUserId },
      });

      if (!user || user.deleted_at) {
        throw new NotFoundError("User not found");
      }

      // Verify booking relationship
      const hasRelationship = await checkTherapistRelationship(finalUserId, finalTherapistId);
      if (!hasRelationship) {
        throw new ForbiddenError("You can only message users who have booked with you");
      }
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { user_id: finalUserId, therapist_id: finalTherapistId },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar_url: true,
            email: true,
          },
        },
        therapist: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar_url: true,
            email: true,
            title: true,
          },
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user_id: finalUserId,
          therapist_id: finalTherapistId,
          is_active: true,
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              avatar_url: true,
              email: true,
            },
          },
          therapist: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              avatar_url: true,
              email: true,
              title: true,
            },
          },
        },
      });
    }

    const role = req.user.type === USER_TYPES.USER ? "user" : "therapist";
    const formattedConversation = await formatConversationResponse(conversation, role);

    res.json(successResponse(formattedConversation));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/conversations/{id}/read:
 *   patch:
 *     summary: Mark conversation as read
 *     description: Updates the last read timestamp for the current user. Only participants can mark as read.
 *     tags: [Conversations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Conversation ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Conversation marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Conversation marked as read"
 *                 data:
 *                   $ref: '#/components/schemas/Conversation'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a participant or admin
 *       404:
 *         description: Conversation not found
 */
router.patch("/:id/read", authenticate, validate(markReadSchema), async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const { role } = await checkConversationAccess(conversationId, req);

    // Update the appropriate last read timestamp
    const updateData = role === "user"
      ? { user_last_read_at: new Date() }
      : { therapist_last_read_at: new Date() };

    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar_url: true,
            email: true,
          },
        },
        therapist: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar_url: true,
            email: true,
            title: true,
          },
        },
      },
    });

    const formattedConversation = await formatConversationResponse(updatedConversation, role);

    // Emit Socket.IO event for read receipt
    const io = getIO();
    if (io) {
      io.to(`conversation-${conversationId}`).emit("message_read", {
        conversationId,
        user: {
          id: req.user.id,
          type: req.user.type,
        },
        readAt: new Date().toISOString(),
      });
    }

    res.json(successResponse(formattedConversation, "Conversation marked as read"));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/conversations/{id}/messages/{messageId}:
 *   delete:
 *     summary: Delete a message (soft delete)
 *     description: Soft delete a message. Only the message sender can delete their own messages.
 *     tags: [Conversations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Conversation ID
 *         example: 1
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Message ID
 *         example: 45
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Message deleted successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the sender or not a participant
 *       404:
 *         description: Message or conversation not found
 */
router.delete("/:id/messages/:messageId", authenticate, validate(deleteMessageSchema), async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const messageId = req.params.messageId;

    // Check conversation access
    await checkConversationAccess(conversationId, req);

    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.conversation_id !== conversationId) {
      throw new NotFoundError("Message not found");
    }

    if (message.deleted_at) {
      throw new NotFoundError("Message not found");
    }

    // Verify sender owns the message
    if (message.sender_type !== req.user.type || message.sender_id !== req.user.id) {
      throw new ForbiddenError("You can only delete your own messages");
    }

    // Soft delete
    await prisma.message.update({
      where: { id: messageId },
      data: {
        deleted_at: new Date(),
        deleted_by: req.user.id,
      },
    });

    res.json(successResponse(null, "Message deleted successfully"));
  } catch (error) {
    next(error);
  }
});

export default router;
