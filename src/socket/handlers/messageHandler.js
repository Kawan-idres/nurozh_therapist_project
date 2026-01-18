import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";
import { USER_TYPES, BOOKING_STATUS } from "../../config/constants.js";

/**
 * Register message-related Socket.IO event handlers
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket instance
 */
export const registerMessageHandlers = (io, socket) => {
  // Join a conversation room
  socket.on("join_conversation", async (data) => {
    await handleJoinConversation(io, socket, data);
  });

  // Leave a conversation room
  socket.on("leave_conversation", async (data) => {
    await handleLeaveConversation(io, socket, data);
  });

  // Send a message
  socket.on("send_message", async (data) => {
    await handleSendMessage(io, socket, data);
  });

  // Typing indicator
  socket.on("typing", async (data) => {
    await handleTyping(io, socket, data);
  });

  // Mark messages as read
  socket.on("mark_read", async (data) => {
    await handleMarkRead(io, socket, data);
  });
};

/**
 * Handle joining a conversation room
 */
const handleJoinConversation = async (io, socket, data) => {
  try {
    const { conversationId } = data;

    if (!conversationId) {
      return emitError(socket, "Conversation ID is required");
    }

    // Verify user has access to this conversation
    const hasAccess = await checkConversationAccess(conversationId, socket.user);
    if (!hasAccess) {
      return emitError(socket, "You don't have access to this conversation");
    }

    const room = `conversation-${conversationId}`;
    socket.join(room);

    logger.info("User joined conversation", {
      userId: socket.user.id,
      conversationId,
    });

    socket.emit("joined_conversation", { conversationId });
  } catch (error) {
    logger.error("Error joining conversation", { error: error.message });
    emitError(socket, "Failed to join conversation");
  }
};

/**
 * Handle leaving a conversation room
 */
const handleLeaveConversation = async (io, socket, data) => {
  try {
    const { conversationId } = data;

    if (!conversationId) {
      return emitError(socket, "Conversation ID is required");
    }

    const room = `conversation-${conversationId}`;
    socket.leave(room);

    logger.info("User left conversation", {
      userId: socket.user.id,
      conversationId,
    });

    socket.emit("left_conversation", { conversationId });
  } catch (error) {
    logger.error("Error leaving conversation", { error: error.message });
    emitError(socket, "Failed to leave conversation");
  }
};

/**
 * Handle sending a message
 */
const handleSendMessage = async (io, socket, data) => {
  try {
    const { conversationId, content, messageType = "text" } = data;

    // Validate input
    if (!conversationId) {
      return emitError(socket, "Conversation ID is required");
    }

    if (!content || content.trim().length === 0) {
      return emitError(socket, "Message content is required");
    }

    if (content.length > 5000) {
      return emitError(socket, "Message content exceeds maximum length");
    }

    // Block system message type
    if (messageType === "system") {
      return emitError(socket, "System message type is reserved");
    }

    // Verify user has access to this conversation
    const hasAccess = await checkConversationAccess(conversationId, socket.user);
    if (!hasAccess) {
      return emitError(socket, "You don't have access to this conversation");
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_type: socket.user.type,
        sender_id: socket.user.id,
        content: content.trim(),
        message_type: messageType,
      },
    });

    // Update conversation last message time
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { last_message_at: new Date() },
    });

    // Get sender details
    const sender = await getSenderDetails(socket.user.type, socket.user.id);

    const messageWithSender = {
      ...message,
      sender,
    };

    // Emit to all participants in the conversation room
    const room = `conversation-${conversationId}`;
    io.to(room).emit("new_message", messageWithSender);

    logger.info("Message sent via Socket.IO", {
      messageId: message.id,
      conversationId,
      senderId: socket.user.id,
    });
  } catch (error) {
    logger.error("Error sending message", { error: error.message });
    emitError(socket, "Failed to send message");
  }
};

/**
 * Handle typing indicator
 */
const handleTyping = async (io, socket, data) => {
  try {
    const { conversationId, isTyping } = data;

    if (!conversationId) {
      return emitError(socket, "Conversation ID is required");
    }

    // Verify user has access
    const hasAccess = await checkConversationAccess(conversationId, socket.user);
    if (!hasAccess) {
      return;
    }

    // Broadcast typing status to other participants
    const room = `conversation-${conversationId}`;
    socket.to(room).emit("user_typing", {
      conversationId,
      user: {
        id: socket.user.id,
        type: socket.user.type,
      },
      isTyping: !!isTyping,
    });
  } catch (error) {
    logger.error("Error handling typing indicator", { error: error.message });
  }
};

/**
 * Handle marking messages as read
 */
const handleMarkRead = async (io, socket, data) => {
  try {
    const { conversationId } = data;

    if (!conversationId) {
      return emitError(socket, "Conversation ID is required");
    }

    // Verify user has access
    const conversation = await checkConversationAccessAndGetDetails(conversationId, socket.user);
    if (!conversation) {
      return emitError(socket, "You don't have access to this conversation");
    }

    // Determine which timestamp to update based on user type
    const updateData = socket.user.type === USER_TYPES.USER
      ? { user_last_read_at: new Date() }
      : { therapist_last_read_at: new Date() };

    await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData,
    });

    // Notify other participants about the read receipt
    const room = `conversation-${conversationId}`;
    socket.to(room).emit("message_read", {
      conversationId,
      user: {
        id: socket.user.id,
        type: socket.user.type,
      },
      readAt: new Date().toISOString(),
    });

    // Confirm to sender
    socket.emit("marked_as_read", { conversationId });

    logger.info("Messages marked as read", {
      userId: socket.user.id,
      conversationId,
    });
  } catch (error) {
    logger.error("Error marking messages as read", { error: error.message });
    emitError(socket, "Failed to mark as read");
  }
};

/**
 * Check if user has access to a conversation
 * @param {number} conversationId - Conversation ID
 * @param {Object} user - User object from socket
 * @returns {Promise<boolean>} True if user has access
 */
const checkConversationAccess = async (conversationId, user) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { user_id: true, therapist_id: true },
    });

    if (!conversation) {
      return false;
    }

    if (user.type === USER_TYPES.USER) {
      return conversation.user_id === user.id;
    } else if (user.type === USER_TYPES.THERAPIST) {
      return conversation.therapist_id === user.id;
    }

    return false;
  } catch (error) {
    logger.error("Error checking conversation access", { error: error.message });
    return false;
  }
};

/**
 * Check conversation access and return conversation details
 * @param {number} conversationId - Conversation ID
 * @param {Object} user - User object from socket
 * @returns {Promise<Object|null>} Conversation object or null
 */
const checkConversationAccessAndGetDetails = async (conversationId, user) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return null;
    }

    if (user.type === USER_TYPES.USER && conversation.user_id === user.id) {
      return conversation;
    } else if (user.type === USER_TYPES.THERAPIST && conversation.therapist_id === user.id) {
      return conversation;
    }

    return null;
  } catch (error) {
    logger.error("Error checking conversation access", { error: error.message });
    return null;
  }
};

/**
 * Get sender details
 * @param {string} senderType - 'user' or 'therapist'
 * @param {number} senderId - Sender ID
 * @returns {Promise<Object|null>} Sender details
 */
const getSenderDetails = async (senderType, senderId) => {
  try {
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
  } catch (error) {
    logger.error("Error getting sender details", { error: error.message });
    return null;
  }
};

/**
 * Emit error to socket
 * @param {Object} socket - Socket instance
 * @param {string} message - Error message
 */
const emitError = (socket, message) => {
  socket.emit("error", { message });
};

export default { registerMessageHandlers };
