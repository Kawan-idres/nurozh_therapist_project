import express from "express";
import prisma from "./config/prisma.js";
import { HTTP_STATUS } from "./config/constants.js";

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check the health status of the API and database connection
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 123.456
 *                 environment:
 *                   type: string
 *                   example: development
 *                 database:
 *                   type: string
 *                   example: connected
 *       503:
 *         description: Service is unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 database:
 *                   type: string
 *                   example: disconnected
 */
router.get("/", async (req, res) => {
  const healthCheck = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    healthCheck.database = "connected";

    res.status(HTTP_STATUS.OK).json(healthCheck);
  } catch (error) {
    healthCheck.status = "error";
    healthCheck.database = "disconnected";
    healthCheck.error = error.message;

    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json(healthCheck);
  }
});

export default router;
