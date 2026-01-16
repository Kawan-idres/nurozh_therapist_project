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
 *     description: Retrieves a paginated list of all users. Requires admin privileges.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       email:
 *                         type: string
 *                       first_name:
 *                         type: string
 *                       last_name:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       gender:
 *                         type: string
 *                       status:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
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
 *     description: Retrieves a single user by their ID
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 1
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *   patch:
 *     summary: Update user
 *     description: Update user profile. Users can update their own profile, admins can update any user.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-15"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: male
 *               avatar_url:
 *                 type: string
 *                 example: "https://example.com/avatar.jpg"
 *               preferred_language:
 *                 type: string
 *                 enum: [en, ar, ku]
 *                 example: en
 *               timezone:
 *                 type: string
 *                 example: "Asia/Baghdad"
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Can only update own profile
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Soft delete user (Admin only)
 *     description: Soft deletes a user by setting deleted_at timestamp and status to inactive. Admin only.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to delete
 *         example: 1
 *     responses:
 *       204:
 *         description: User deleted successfully (no content)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 */
router.get("/:id", authenticate, authorize("users:read"), async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new NotFoundError("User not found");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deleted_at) {
      throw new NotFoundError("User not found");
    }

    res.json(successResponse(sanitizeUser(user)));
  } catch (error) {
    next(error);
  }
});

// PATCH /:id - Update user (documentation above with GET)
router.patch("/:id", authenticate, ownerOrAdmin((req) => parseInt(req.params.id, 10)), async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new NotFoundError("User not found");
    }

    const { first_name, last_name, date_of_birth, gender, avatar_url, preferred_language, timezone } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
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

// DELETE /:id - Soft delete user (documentation above with GET)
router.delete("/:id", authenticate, authorize("users:delete"), async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new NotFoundError("User not found");
    }

    // Check if user exists first
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deleted_at) {
      throw new NotFoundError("User not found");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { deleted_at: new Date(), status: "inactive" },
    });

    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
});

export default router;
