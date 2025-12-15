import prisma from "../../config/prisma.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import {
  generateTokenPair,
  verifyRefreshToken,
  calculateExpirationDate,
} from "../../utils/jwt.js";
import { generateOTP } from "../../utils/helpers.js";
import {
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../../utils/errors.js";
import {
  USER_TYPES,
  ERROR_MESSAGES,
  OTP_CONFIG,
  THERAPIST_STATUS,
} from "../../config/constants.js";
import { env } from "../../config/env.js";

/**
 * Register a new user
 */
export const registerUser = async (data) => {
  // Check if email already exists
  if (data.email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      throw new ConflictError(ERROR_MESSAGES.EMAIL_EXISTS);
    }
  }

  // Hash password
  const password_hash = await hashPassword(data.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      phone: data.phone,
      password_hash,
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
      gender: data.gender,
      preferred_language: data.preferred_language,
      timezone: data.timezone,
      auth_provider: data.email ? "email" : "phone",
      status: "active",
    },
  });

  // Generate tokens
  const tokenPayload = {
    id: user.id,
    email: user.email,
    type: USER_TYPES.USER,
    role: "patient",
  };

  const tokens = generateTokenPair(tokenPayload);

  // Store refresh token
  await storeRefreshToken(tokens.refreshToken, USER_TYPES.USER, user.id);

  // Remove sensitive data
  const { password_hash: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    ...tokens,
  };
};

/**
 * Register a new therapist
 */
export const registerTherapist = async (data) => {
  // Check if email already exists
  const existingEmail = await prisma.therapist.findUnique({
    where: { email: data.email },
  });
  if (existingEmail) {
    throw new ConflictError(ERROR_MESSAGES.EMAIL_EXISTS);
  }

  // Hash password
  const password_hash = await hashPassword(data.password);

  // Create therapist
  const therapist = await prisma.therapist.create({
    data: {
      email: data.email,
      phone: data.phone,
      password_hash,
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
      gender: data.gender,
      bio: data.bio,
      title: data.title,
      years_of_experience: data.years_of_experience,
      license_number: data.license_number,
      spoken_languages: data.spoken_languages || [],
      preferred_language: data.preferred_language,
      timezone: data.timezone,
      status: THERAPIST_STATUS.PENDING, // Requires admin approval
    },
  });

  // Generate tokens
  const tokenPayload = {
    id: therapist.id,
    email: therapist.email,
    type: USER_TYPES.THERAPIST,
    role: "therapist",
  };

  const tokens = generateTokenPair(tokenPayload);

  // Store refresh token
  await storeRefreshToken(tokens.refreshToken, USER_TYPES.THERAPIST, therapist.id);

  // Remove sensitive data
  const { password_hash: _, ...therapistWithoutPassword } = therapist;

  return {
    therapist: therapistWithoutPassword,
    ...tokens,
  };
};

/**
 * Login user
 */
export const loginUser = async (data) => {
  let user;

  if (data.email) {
    user = await prisma.user.findUnique({
      where: { email: data.email },
    });
  } else if (data.phone) {
    user = await prisma.user.findFirst({
      where: { phone: data.phone },
    });
  }

  if (!user) {
    throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  if (user.deleted_at) {
    throw new UnauthorizedError("Account has been deleted");
  }

  if (user.status !== "active") {
    throw new UnauthorizedError("Account is not active");
  }

  // Verify password
  const isValid = await comparePassword(data.password, user.password_hash);
  if (!isValid) {
    throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

  // Generate tokens
  const tokenPayload = {
    id: user.id,
    email: user.email,
    type: USER_TYPES.USER,
    role: "patient",
  };

  const tokens = generateTokenPair(tokenPayload);

  // Store refresh token
  await storeRefreshToken(tokens.refreshToken, USER_TYPES.USER, user.id);

  // Remove sensitive data
  const { password_hash: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    ...tokens,
  };
};

/**
 * Login therapist
 */
export const loginTherapist = async (data) => {
  const therapist = await prisma.therapist.findUnique({
    where: { email: data.email },
  });

  if (!therapist) {
    throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  if (therapist.deleted_at) {
    throw new UnauthorizedError("Account has been deleted");
  }

  if (therapist.status !== THERAPIST_STATUS.APPROVED) {
    throw new UnauthorizedError(
      `Your account is ${therapist.status}. Please wait for admin approval.`
    );
  }

  // Verify password
  const isValid = await comparePassword(data.password, therapist.password_hash);
  if (!isValid) {
    throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Update last login
  await prisma.therapist.update({
    where: { id: therapist.id },
    data: { last_login_at: new Date() },
  });

  // Generate tokens
  const tokenPayload = {
    id: therapist.id,
    email: therapist.email,
    type: USER_TYPES.THERAPIST,
    role: "therapist",
  };

  const tokens = generateTokenPair(tokenPayload);

  // Store refresh token
  await storeRefreshToken(tokens.refreshToken, USER_TYPES.THERAPIST, therapist.id);

  // Remove sensitive data
  const { password_hash: _, ...therapistWithoutPassword } = therapist;

  return {
    therapist: therapistWithoutPassword,
    ...tokens,
  };
};

/**
 * Login admin
 */
export const loginAdmin = async (data) => {
  const admin = await prisma.admin.findUnique({
    where: { email: data.email },
  });

  if (!admin) {
    throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  if (!admin.is_active) {
    throw new UnauthorizedError("Account is not active");
  }

  // Verify password
  const isValid = await comparePassword(data.password, admin.password_hash);
  if (!isValid) {
    throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Update last login
  await prisma.admin.update({
    where: { id: admin.id },
    data: { last_login_at: new Date() },
  });

  // Generate tokens
  const tokenPayload = {
    id: admin.id,
    email: admin.email,
    type: USER_TYPES.ADMIN,
    role: admin.role,
  };

  const tokens = generateTokenPair(tokenPayload);

  // Store refresh token
  await storeRefreshToken(tokens.refreshToken, USER_TYPES.ADMIN, admin.id);

  // Remove sensitive data
  const { password_hash: _, ...adminWithoutPassword } = admin;

  return {
    admin: adminWithoutPassword,
    ...tokens,
  };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken) => {
  // Verify the refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Check if token exists in database and is not revoked
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (storedToken.revoked_at) {
    throw new UnauthorizedError("Refresh token has been revoked");
  }

  if (new Date() > storedToken.expires_at) {
    throw new UnauthorizedError("Refresh token has expired");
  }

  // Generate new token pair
  const tokenPayload = {
    id: decoded.id,
    email: decoded.email,
    type: decoded.type,
    role: decoded.role,
  };

  const tokens = generateTokenPair(tokenPayload);

  // Revoke old refresh token and store new one
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked_at: new Date() },
  });

  await storeRefreshToken(tokens.refreshToken, decoded.type, decoded.id);

  return tokens;
};

/**
 * Logout - revoke refresh token
 */
export const logout = async (refreshToken) => {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (storedToken && !storedToken.revoked_at) {
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked_at: new Date() },
    });
  }

  return { success: true };
};

/**
 * Logout from all devices - revoke all refresh tokens for user
 */
export const logoutAll = async (userId, userType) => {
  await prisma.refreshToken.updateMany({
    where: {
      user_id: userId,
      user_type: userType,
      revoked_at: null,
    },
    data: { revoked_at: new Date() },
  });

  return { success: true };
};

/**
 * Change password
 */
export const changePassword = async (userId, userType, currentPassword, newPassword) => {
  let user;
  let updateQuery;

  switch (userType) {
    case USER_TYPES.USER:
      user = await prisma.user.findUnique({ where: { id: userId } });
      updateQuery = prisma.user.update;
      break;
    case USER_TYPES.THERAPIST:
      user = await prisma.therapist.findUnique({ where: { id: userId } });
      updateQuery = prisma.therapist.update;
      break;
    case USER_TYPES.ADMIN:
      user = await prisma.admin.findUnique({ where: { id: userId } });
      updateQuery = prisma.admin.update;
      break;
    default:
      throw new BadRequestError("Invalid user type");
  }

  if (!user) {
    throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
  }

  // Verify current password
  const isValid = await comparePassword(currentPassword, user.password_hash);
  if (!isValid) {
    throw new UnauthorizedError("Current password is incorrect");
  }

  // Hash new password
  const password_hash = await hashPassword(newPassword);

  // Update password
  await updateQuery({
    where: { id: userId },
    data: { password_hash },
  });

  // Revoke all refresh tokens (force re-login)
  await logoutAll(userId, userType);

  return { success: true };
};

/**
 * Store refresh token in database
 */
const storeRefreshToken = async (token, userType, userId) => {
  const expiresAt = calculateExpirationDate(env.JWT_REFRESH_EXPIRES_IN);

  await prisma.refreshToken.create({
    data: {
      token,
      user_type: userType,
      user_id: userId,
      expires_at: expiresAt,
    },
  });
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (userId, userType) => {
  let user;

  switch (userType) {
    case USER_TYPES.USER:
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
      break;
    case USER_TYPES.THERAPIST:
      user = await prisma.therapist.findUnique({
        where: { id: userId },
      });
      break;
    case USER_TYPES.ADMIN:
      user = await prisma.admin.findUnique({
        where: { id: userId },
      });
      break;
    default:
      throw new BadRequestError("Invalid user type");
  }

  if (!user) {
    throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
  }

  // Remove sensitive data
  const { password_hash: _, ...userWithoutPassword } = user;

  return userWithoutPassword;
};
