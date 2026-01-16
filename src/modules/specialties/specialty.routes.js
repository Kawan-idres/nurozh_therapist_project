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
 * /api/v1/specialties:
 *   get:
 *     summary: Get all specialties
 *     tags: [Specialties]
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
 *     tags: [Specialties]
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
 *     summary: Create specialty (Admin)
 *     tags: [Specialties]
 *     security:
 *       - BearerAuth: []
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
 *     summary: Update specialty (Admin)
 *     tags: [Specialties]
 *     security:
 *       - BearerAuth: []
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
 *     summary: Delete specialty (Admin)
 *     tags: [Specialties]
 *     security:
 *       - BearerAuth: []
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
