import { Router } from "express";
import * as authController from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
import {
  userRegisterSchema,
  therapistRegisterSchema,
  userLoginSchema,
  therapistLoginSchema,
  adminLoginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from "./auth.schema.js";

const router = Router();

/**
 * @swagger
 * /api/v1/auth/register/user:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer_not_to_say]
 *               preferred_language:
 *                 type: string
 *                 enum: [en, ar, ku]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: Email already exists
 */
router.post(
  "/register/user",
  validate(userRegisterSchema),
  authController.registerUser
);

/**
 * @swagger
 * /api/v1/auth/register/therapist:
 *   post:
 *     summary: Create a new therapist (Admin only)
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: therapist@example.com
 *               phone:
 *                 type: string
 *                 example: "+9647501234567"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "SecurePass123!"
 *               first_name:
 *                 type: string
 *                 example: "John"
 *               last_name:
 *                 type: string
 *                 example: "Doe"
 *               years_of_experience:
 *                 type: integer
 *                 example: 5
 *               license_number:
 *                 type: string
 *                 example: "LIC-12345"
 *               bio:
 *                 type: object
 *                 description: Multilingual bio
 *                 example: {"en": "Experienced therapist", "ar": "معالج متمرس"}
 *               title:
 *                 type: object
 *                 description: Multilingual title
 *                 example: {"en": "Clinical Psychologist", "ar": "أخصائي نفسي سريري"}
 *               spoken_languages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["en", "ar"]
 *               session_rate_amount:
 *                 type: number
 *                 example: 75.00
 *               session_rate_currency:
 *                 type: string
 *                 example: "USD"
 *               specialty_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of specialty IDs to assign to the therapist
 *                 example: [1, 2, 3]
 *     responses:
 *       201:
 *         description: Therapist created successfully
 *       401:
 *         description: Unauthorized - Admin access required
 *       409:
 *         description: Email already exists
 */
router.post(
  "/register/therapist",
  authenticate,
  authorize("therapists:create"),
  validate(therapistRegisterSchema),
  authController.registerTherapist
);

/**
 * @swagger
 * /api/v1/auth/login/user:
 *   post:
 *     summary: Login as user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post(
  "/login/user",
  validate(userLoginSchema),
  authController.loginUser
);

/**
 * @swagger
 * /api/v1/auth/login/therapist:
 *   post:
 *     summary: Login as therapist
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials or not approved
 */
router.post(
  "/login/therapist",
  validate(therapistLoginSchema),
  authController.loginTherapist
);

/**
 * @swagger
 * /api/v1/auth/login/admin:
 *   post:
 *     summary: Login as admin
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  "/login/admin",
  validate(adminLoginSchema),
  authController.loginAdmin
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refreshToken
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout (revoke refresh token)
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post(
  "/logout",
  authenticate,
  validate(refreshTokenSchema),
  authController.logout
);

/**
 * @swagger
 * /api/v1/auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices
 */
router.post("/logout-all", authenticate, authController.logoutAll);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     summary: Change password
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect
 */
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticate, authController.getCurrentUser);

export default router;
