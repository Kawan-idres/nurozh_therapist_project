import * as authService from "./auth.service.js";
import { successResponse } from "../../utils/helpers.js";
import { HTTP_STATUS } from "../../config/constants.js";

/**
 * @desc    Register new user
 * @route   POST /api/v1/auth/register/user
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(HTTP_STATUS.CREATED).json(successResponse(result, "User registered successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new therapist (Admin only)
 * @route   POST /api/v1/auth/register/therapist
 * @access  Private (Admin)
 */
export const registerTherapist = async (req, res, next) => {
  try {
    const result = await authService.registerTherapist(req.body, req.user.id);
    res.status(HTTP_STATUS.CREATED).json(
      successResponse(result, "Therapist created successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login/user
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    res.status(HTTP_STATUS.OK).json(successResponse(result, "Login successful"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login therapist
 * @route   POST /api/v1/auth/login/therapist
 * @access  Public
 */
export const loginTherapist = async (req, res, next) => {
  try {
    const result = await authService.loginTherapist(req.body);
    res.status(HTTP_STATUS.OK).json(successResponse(result, "Login successful"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login admin
 * @route   POST /api/v1/auth/login/admin
 * @access  Public
 */
export const loginAdmin = async (req, res, next) => {
  try {
    const result = await authService.loginAdmin(req.body);
    res.status(HTTP_STATUS.OK).json(successResponse(result, "Login successful"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    res.status(HTTP_STATUS.OK).json(successResponse(result, "Token refreshed successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user (revoke refresh token)
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.status(HTTP_STATUS.OK).json(successResponse(null, "Logged out successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout from all devices
 * @route   POST /api/v1/auth/logout-all
 * @access  Private
 */
export const logoutAll = async (req, res, next) => {
  try {
    await authService.logoutAll(req.user.id, req.user.type);
    res.status(HTTP_STATUS.OK).json(successResponse(null, "Logged out from all devices"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   POST /api/v1/auth/change-password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(
      req.user.id,
      req.user.type,
      currentPassword,
      newPassword
    );
    res.status(HTTP_STATUS.OK).json(successResponse(null, "Password changed successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id, req.user.type);
    res.status(HTTP_STATUS.OK).json(successResponse({ user, userType: req.user.type }));
  } catch (error) {
    next(error);
  }
};
