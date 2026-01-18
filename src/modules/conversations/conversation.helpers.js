import prisma from "../../config/prisma.js";
import { NotFoundError, ForbiddenError } from "../../utils/errors.js";
import { USER_TYPES, BOOKING_STATUS } from "../../config/constants.js";

/**
 * Check if a user has access to a conversation
 * @param {number} conversationId - Conversation ID
 * @param {Object} req - Express request object with user info
 * @returns {Promise<{conversation: Object, role: string}>} Conversation and user role
 * @throws {NotFoundError} If conversation doesn't exist
 * @throws {ForbiddenError} If user is admin or not a participant
 */
export const checkConversationAccess = async (conversationId, req) => {
  // Block admins from messaging
  if (req.user.type === USER_TYPES.ADMIN) {
    throw new ForbiddenError("Admins cannot access messaging features");
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
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
    throw new NotFoundError("Conversation not found");
  }

  // Check if user is a participant
  let role = null;
  if (req.user.type === USER_TYPES.USER && conversation.user_id === req.user.id) {
    role = "user";
  } else if (req.user.type === USER_TYPES.THERAPIST && conversation.therapist_id === req.user.id) {
    role = "therapist";
  }

  if (!role) {
    throw new ForbiddenError("You don't have access to this conversation");
  }

  return { conversation, role };
};

/**
 * Check if a user has a booking relationship with a therapist
 * @param {number} userId - User ID
 * @param {number} therapistId - Therapist ID
 * @returns {Promise<boolean>} True if relationship exists
 */
export const checkTherapistRelationship = async (userId, therapistId) => {
  const booking = await prisma.booking.findFirst({
    where: {
      user_id: userId,
      therapist_id: therapistId,
      status: {
        in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED],
      },
    },
  });

  return !!booking;
};

/**
 * Get unread message count for a conversation based on user role
 * @param {Object} conversation - Conversation object with timestamps
 * @param {string} role - User role ('user' or 'therapist')
 * @returns {Promise<number>} Unread message count
 */
export const getUnreadCount = async (conversation, role) => {
  const lastReadAt = role === "user"
    ? conversation.user_last_read_at
    : conversation.therapist_last_read_at;

  // If user has never read, count messages from the other party
  const senderType = role === "user" ? "therapist" : "user";

  const whereClause = {
    conversation_id: conversation.id,
    sender_type: senderType,
    deleted_at: null,
  };

  if (lastReadAt) {
    whereClause.created_at = { gt: lastReadAt };
  }

  return prisma.message.count({ where: whereClause });
};

/**
 * Get the last message for a conversation
 * @param {number} conversationId - Conversation ID
 * @returns {Promise<Object|null>} Last message or null
 */
export const getLastMessage = async (conversationId) => {
  return prisma.message.findFirst({
    where: {
      conversation_id: conversationId,
      deleted_at: null,
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      content: true,
      sender_type: true,
      message_type: true,
      created_at: true,
    },
  });
};

/**
 * Format conversation response with participant details, unread count, and last message
 * @param {Object} conversation - Conversation from database
 * @param {string} role - User role ('user' or 'therapist')
 * @returns {Promise<Object>} Formatted conversation
 */
export const formatConversationResponse = async (conversation, role) => {
  const [unreadCount, lastMessage] = await Promise.all([
    getUnreadCount(conversation, role),
    getLastMessage(conversation.id),
  ]);

  return {
    id: conversation.id,
    user: conversation.user,
    therapist: conversation.therapist,
    is_active: conversation.is_active,
    last_message_at: conversation.last_message_at,
    user_last_read_at: conversation.user_last_read_at,
    therapist_last_read_at: conversation.therapist_last_read_at,
    created_at: conversation.created_at,
    updated_at: conversation.updated_at,
    unread_count: unreadCount,
    last_message: lastMessage,
  };
};

/**
 * Get sender details for a message
 * @param {string} senderType - 'user' or 'therapist'
 * @param {number} senderId - Sender ID
 * @returns {Promise<Object|null>} Sender details
 */
export const getSenderDetails = async (senderType, senderId) => {
  if (senderType === USER_TYPES.USER) {
    return prisma.user.findUnique({
      where: { id: senderId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        avatar_url: true,
      },
    });
  } else if (senderType === USER_TYPES.THERAPIST) {
    return prisma.therapist.findUnique({
      where: { id: senderId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        avatar_url: true,
        title: true,
      },
    });
  }
  return null;
};
