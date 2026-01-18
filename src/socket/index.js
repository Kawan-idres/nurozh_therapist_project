import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/jwt.js";
import { USER_TYPES } from "../config/constants.js";
import prisma from "../config/prisma.js";
import logger from "../config/logger.js";
import { registerMessageHandlers } from "./handlers/messageHandler.js";

let io = null;

/**
 * Initialize Socket.IO with the HTTP server
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      // Remove "Bearer " prefix if present
      const cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;

      // Verify the token
      const decoded = verifyAccessToken(cleanToken);

      // Block admins from Socket.IO connections
      if (decoded.type === USER_TYPES.ADMIN) {
        return next(new Error("Admins cannot access messaging features"));
      }

      // Verify user is active
      const isActive = await verifyUserIsActive(decoded.id, decoded.type);
      if (!isActive) {
        return next(new Error("User account is not active"));
      }

      // Attach user info to socket
      socket.user = {
        id: decoded.id,
        email: decoded.email,
        type: decoded.type,
        role: decoded.role,
      };

      next();
    } catch (error) {
      logger.error("Socket authentication failed", { error: error.message });
      next(new Error(error.message || "Authentication failed"));
    }
  });

  // Connection handler
  io.on("connection", async (socket) => {
    logger.info("Socket connected", {
      socketId: socket.id,
      userId: socket.user.id,
      userType: socket.user.type,
    });

    // Join user to their personal room
    const userRoom = `${socket.user.type}-${socket.user.id}`;
    socket.join(userRoom);

    // Auto-join all user's conversations
    await joinUserConversations(socket);

    // Register message event handlers
    registerMessageHandlers(io, socket);

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      logger.info("Socket disconnected", {
        socketId: socket.id,
        userId: socket.user.id,
        reason,
      });
    });

    // Handle errors
    socket.on("error", (error) => {
      logger.error("Socket error", {
        socketId: socket.id,
        userId: socket.user.id,
        error: error.message,
      });
    });
  });

  logger.info("Socket.IO initialized");
  return io;
};

/**
 * Verify user is active in the database
 * @param {number} userId - User ID
 * @param {string} userType - User type (user or therapist)
 * @returns {Promise<boolean>} True if user is active
 */
const verifyUserIsActive = async (userId, userType) => {
  try {
    if (userType === USER_TYPES.USER) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, status: true, deleted_at: true },
      });
      return user && !user.deleted_at && user.status === "active";
    } else if (userType === USER_TYPES.THERAPIST) {
      const therapist = await prisma.therapist.findUnique({
        where: { id: userId },
        select: { id: true, status: true, deleted_at: true },
      });
      return therapist && !therapist.deleted_at && therapist.status === "approved";
    }
    return false;
  } catch (error) {
    logger.error("Error verifying user active status", { error: error.message });
    return false;
  }
};

/**
 * Join user to all their conversation rooms
 * @param {Object} socket - Socket instance
 */
const joinUserConversations = async (socket) => {
  try {
    const where = { is_active: true };

    if (socket.user.type === USER_TYPES.USER) {
      where.user_id = socket.user.id;
    } else if (socket.user.type === USER_TYPES.THERAPIST) {
      where.therapist_id = socket.user.id;
    }

    const conversations = await prisma.conversation.findMany({
      where,
      select: { id: true },
    });

    conversations.forEach((conv) => {
      socket.join(`conversation-${conv.id}`);
    });

    logger.info("User joined conversation rooms", {
      userId: socket.user.id,
      conversationCount: conversations.length,
    });
  } catch (error) {
    logger.error("Error joining user conversations", { error: error.message });
  }
};

/**
 * Get the Socket.IO instance
 * @returns {Object|null} Socket.IO server instance
 */
export const getIO = () => io;

export default { initializeSocket, getIO };
