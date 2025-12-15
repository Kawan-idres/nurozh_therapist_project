import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import prisma from "../../config/prisma.js";
import { successResponse, paginatedResponse, buildPaginationResponse, parsePaginationParams } from "../../utils/helpers.js";
import { NotFoundError } from "../../utils/errors.js";
import { HTTP_STATUS, SESSION_STATUS, USER_TYPES } from "../../config/constants.js";

const router = Router();

/**
 * @swagger
 * /api/v1/sessions:
 *   get:
 *     summary: Get sessions
 *     tags: [Sessions]
 *     security:
 *       - BearerAuth: []
 */
router.get("/", authenticate, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    const sessions = await prisma.session.findMany({ skip, take: limit, orderBy: { created_at: "desc" } });
    const total = await prisma.session.count();
    const pagination = buildPaginationResponse(page, limit, total);
    res.json(paginatedResponse(sessions, pagination));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/sessions/{id}:
 *   get:
 *     summary: Get session by ID
 *     tags: [Sessions]
 *     security:
 *       - BearerAuth: []
 */
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const session = await prisma.session.findUnique({ where: { id: req.params.id } });
    if (!session) throw new NotFoundError("Session not found");
    res.json(successResponse(session));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/sessions/{id}/start:
 *   post:
 *     summary: Start a session
 *     tags: [Sessions]
 *     security:
 *       - BearerAuth: []
 */
router.post("/:id/start", authenticate, async (req, res, next) => {
  try {
    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: { status: SESSION_STATUS.IN_PROGRESS, started_at: new Date() },
    });
    res.json(successResponse(session, "Session started"));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/sessions/{id}/end:
 *   post:
 *     summary: End a session
 *     tags: [Sessions]
 *     security:
 *       - BearerAuth: []
 */
router.post("/:id/end", authenticate, async (req, res, next) => {
  try {
    const session = await prisma.session.findUnique({ where: { id: req.params.id } });
    const duration = session.started_at ? Math.round((Date.now() - new Date(session.started_at).getTime()) / 60000) : 0;

    const updated = await prisma.session.update({
      where: { id: req.params.id },
      data: { status: SESSION_STATUS.COMPLETED, ended_at: new Date(), actual_duration_minutes: duration },
    });
    res.json(successResponse(updated, "Session ended"));
  } catch (error) {
    next(error);
  }
});

export default router;
