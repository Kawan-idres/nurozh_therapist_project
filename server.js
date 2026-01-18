import { createServer } from "http";
import { env } from "./src/config/env.js";
import app from "./src/app.js";
import logger from "./src/config/logger.js";
import prisma from "./src/config/prisma.js";
import { initializeSocket } from "./src/socket/index.js";

const PORT = env.PORT;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);

// Start server
const server = httpServer.listen(PORT, () => {
  logger.info(`Server started successfully`, {
    port: PORT,
    environment: env.NODE_ENV,
    nodeVersion: process.version,
  });
  console.log(`\n🚀 Nurozh Therapy Platform API running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
  console.log(`🔌 Socket.IO: ws://localhost:${PORT}\n`);
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info("HTTP server closed");
    console.log("✓ HTTP server closed");

    try {
      // Disconnect Prisma
      await prisma.$disconnect();
      logger.info("Database connection closed");
      console.log("✓ Database connection closed");

      logger.info("Graceful shutdown completed");
      console.log("✓ Graceful shutdown completed\n");
      process.exit(0);
    } catch (error) {
      logger.error("Error during graceful shutdown", { error });
      console.error("✗ Error during graceful shutdown:", error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    console.error("✗ Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", { error });
  console.error("Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", { reason, promise });
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("UNHANDLED_REJECTION");
});
