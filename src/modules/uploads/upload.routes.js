import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
import { successResponse } from "../../utils/helpers.js";
import { BadRequestError } from "../../utils/errors.js";
import { HTTP_STATUS, UPLOAD_CONFIG } from "../../config/constants.js";
import { env } from "../../config/env.js";

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [...UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES, ...UPLOAD_CONFIG.ALLOWED_DOCUMENT_TYPES];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`Invalid file type. Allowed: ${allowedTypes.join(", ")}`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE },
  fileFilter,
});

/**
 * @swagger
 * /api/v1/uploads/image:
 *   post:
 *     summary: Upload an image
 *     tags: [Uploads]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 */
router.post("/image", authenticate, authorize("uploads:create"), upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError("No file uploaded");
    }

    // In production, upload to Bunny CDN or S3
    // For now, return a placeholder response
    const fileUrl = `https://placeholder.nurozh.com/uploads/${Date.now()}-${req.file.originalname}`;

    res.status(HTTP_STATUS.CREATED).json(
      successResponse({
        url: fileUrl,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      }, "File uploaded successfully")
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/uploads/document:
 *   post:
 *     summary: Upload a document
 *     tags: [Uploads]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 */
router.post("/document", authenticate, authorize("uploads:create"), upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError("No file uploaded");
    }

    const fileUrl = `https://placeholder.nurozh.com/documents/${Date.now()}-${req.file.originalname}`;

    res.status(HTTP_STATUS.CREATED).json(
      successResponse({
        url: fileUrl,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      }, "Document uploaded successfully")
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/uploads/avatar:
 *   post:
 *     summary: Upload avatar image
 *     tags: [Uploads]
 *     security:
 *       - BearerAuth: []
 */
router.post("/avatar", authenticate, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError("No file uploaded");
    }

    if (!UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
      throw new BadRequestError("Only image files are allowed for avatars");
    }

    const fileUrl = `https://placeholder.nurozh.com/avatars/${Date.now()}-${req.file.originalname}`;

    res.status(HTTP_STATUS.CREATED).json(
      successResponse({
        url: fileUrl,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      }, "Avatar uploaded successfully")
    );
  } catch (error) {
    next(error);
  }
});

export default router;
