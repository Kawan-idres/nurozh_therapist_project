import { Router } from "express";
import { authenticate, adminOnly, ownerOrAdmin } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
import prisma from "../../config/prisma.js";
import { successResponse, paginatedResponse, buildPaginationResponse, parsePaginationParams, sanitizeUser } from "../../utils/helpers.js";
import { NotFoundError } from "../../utils/errors.js";
import { HTTP_STATUS } from "../../config/constants.js";

const router = Router();

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
router.get("/", authenticate, authorize("users:read"), async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    const where = { deleted_at: null };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    const sanitizedUsers = users.map(sanitizeUser);
    const pagination = buildPaginationResponse(page, limit, total);

    res.json(paginatedResponse(sanitizedUsers, pagination));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
router.get("/:id", authenticate, authorize("users:read"), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!user || user.deleted_at) {
      throw new NotFoundError("User not found");
    }

    res.json(successResponse(sanitizeUser(user)));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/users/{id}:
 *   patch:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
router.patch("/:id", authenticate, ownerOrAdmin((req) => req.params.id), async (req, res, next) => {
  try {
    const { first_name, last_name, date_of_birth, gender, avatar_url, preferred_language, timezone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(first_name && { first_name }),
        ...(last_name && { last_name }),
        ...(date_of_birth && { date_of_birth: new Date(date_of_birth) }),
        ...(gender && { gender }),
        ...(avatar_url && { avatar_url }),
        ...(preferred_language && { preferred_language }),
        ...(timezone && { timezone }),
      },
    });

    res.json(successResponse(sanitizeUser(user), "User updated successfully"));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Soft delete user (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
router.delete("/:id", authenticate, authorize("users:delete"), async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { deleted_at: new Date(), status: "inactive" },
    });

    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
});

export default router;
