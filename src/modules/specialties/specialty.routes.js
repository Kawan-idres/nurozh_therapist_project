import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
import prisma from "../../config/prisma.js";
import { successResponse, paginatedResponse, buildPaginationResponse, parsePaginationParams } from "../../utils/helpers.js";
import { NotFoundError } from "../../utils/errors.js";
import { HTTP_STATUS } from "../../config/constants.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Specialty:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: object
 *           description: Multilingual name
 *           example: {"en": "Anxiety", "ar": "القلق", "ku": "نیگەرانی"}
 *         description:
 *           type: object
 *           description: Multilingual description
 *           example: {"en": "Anxiety disorders and related conditions"}
 *         icon_url:
 *           type: string
 *           example: "https://example.com/icons/anxiety.png"
 *         display_order:
 *           type: integer
 *           example: 1
 *         is_active:
 *           type: boolean
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/specialties:
 *   get:
 *     summary: Get all specialties
 *     description: Returns a list of all active specialties. No authentication required.
 *     tags: [Specialties]
 *     responses:
 *       200:
 *         description: List of specialties retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Specialty'
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   name: {"en": "Anxiety", "ar": "القلق", "ku": "نیگەرانی"}
 *                   description: {"en": "Anxiety disorders and related conditions"}
 *                   icon_url: null
 *                   display_order: 1
 *                   is_active: true
 *                 - id: 2
 *                   name: {"en": "Depression", "ar": "الاكتئاب", "ku": "خەمۆکی"}
 *                   description: {"en": "Depression and mood disorders"}
 *                   icon_url: null
 *                   display_order: 2
 *                   is_active: true
 */
router.get("/", async (req, res, next) => {
  try {
    const specialties = await prisma.specialty.findMany({
      where: { is_active: true },
      orderBy: { display_order: "asc" },
    });
    res.json(successResponse(specialties));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/specialties/{id}:
 *   get:
 *     summary: Get specialty by ID
 *     description: Returns a single specialty by its ID
 *     tags: [Specialties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Specialty ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Specialty retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Specialty'
 *       404:
 *         description: Specialty not found
 */
router.get("/:id", async (req, res, next) => {
  try {
    const specialtyId = parseInt(req.params.id, 10);
    if (isNaN(specialtyId)) {
      throw new NotFoundError("Specialty not found");
    }

    const specialty = await prisma.specialty.findUnique({ where: { id: specialtyId } });
    if (!specialty) throw new NotFoundError("Specialty not found");
    res.json(successResponse(specialty));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/specialties:
 *   post:
 *     summary: Create specialty (Admin only)
 *     description: Creates a new specialty. Requires admin authentication with specialties:create permission.
 *     tags: [Specialties]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: object
 *                 description: Multilingual name (required)
 *                 example: {"en": "Addiction", "ar": "الإدمان", "ku": "ئاڵوودەبوون"}
 *               description:
 *                 type: object
 *                 description: Multilingual description
 *                 example: {"en": "Addiction recovery and support"}
 *               icon_url:
 *                 type: string
 *                 description: URL to specialty icon
 *                 example: "https://example.com/icons/addiction.png"
 *               display_order:
 *                 type: integer
 *                 description: Order in which to display the specialty
 *                 example: 5
 *     responses:
 *       201:
 *         description: Specialty created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Specialty created"
 *                 data:
 *                   $ref: '#/components/schemas/Specialty'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - specialties:create permission required
 */
router.post("/", authenticate, authorize("specialties:create"), async (req, res, next) => {
  try {
    const { name, description, icon_url, display_order } = req.body;
    const specialty = await prisma.specialty.create({
      data: { name, description, icon_url, display_order, is_active: true, created_by: req.user.id },
    });
    res.status(HTTP_STATUS.CREATED).json(successResponse(specialty, "Specialty created"));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/specialties/{id}:
 *   patch:
 *     summary: Update specialty (Admin only)
 *     description: Updates an existing specialty. Requires admin authentication with specialties:update permission.
 *     tags: [Specialties]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Specialty ID to update
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: object
 *                 description: Multilingual name
 *                 example: {"en": "Anxiety Disorders", "ar": "اضطرابات القلق"}
 *               description:
 *                 type: object
 *                 description: Multilingual description
 *                 example: {"en": "Updated description for anxiety disorders"}
 *               icon_url:
 *                 type: string
 *                 example: "https://example.com/icons/anxiety-new.png"
 *               display_order:
 *                 type: integer
 *                 example: 1
 *               is_active:
 *                 type: boolean
 *                 description: Set to false to deactivate specialty
 *                 example: true
 *     responses:
 *       200:
 *         description: Specialty updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Specialty updated"
 *                 data:
 *                   $ref: '#/components/schemas/Specialty'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - specialties:update permission required
 *       404:
 *         description: Specialty not found
 */
router.patch("/:id", authenticate, authorize("specialties:update"), async (req, res, next) => {
  try {
    const specialtyId = parseInt(req.params.id, 10);
    if (isNaN(specialtyId)) {
      throw new NotFoundError("Specialty not found");
    }

    const { name, description, icon_url, display_order, is_active } = req.body;
    const specialty = await prisma.specialty.update({
      where: { id: specialtyId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(icon_url && { icon_url }),
        ...(display_order !== undefined && { display_order }),
        ...(is_active !== undefined && { is_active }),
      },
    });
    res.json(successResponse(specialty, "Specialty updated"));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/specialties/{id}:
 *   delete:
 *     summary: Delete specialty (Admin only)
 *     description: Soft deletes a specialty by setting is_active to false. Requires admin authentication with specialties:delete permission.
 *     tags: [Specialties]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Specialty ID to delete
 *         example: 1
 *     responses:
 *       204:
 *         description: Specialty deleted successfully (no content)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - specialties:delete permission required
 *       404:
 *         description: Specialty not found
 */
router.delete("/:id", authenticate, authorize("specialties:delete"), async (req, res, next) => {
  try {
    const specialtyId = parseInt(req.params.id, 10);
    if (isNaN(specialtyId)) {
      throw new NotFoundError("Specialty not found");
    }

    await prisma.specialty.update({ where: { id: specialtyId }, data: { is_active: false } });
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
});

export default router;
