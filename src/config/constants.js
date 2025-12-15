// API Configuration
export const API_VERSION = "v1";
export const API_PREFIX = `/api/${API_VERSION}`;

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

// Rate limiting
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 100; // max 100 requests per window

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Error Messages
export const ERROR_MESSAGES = {
  NOT_FOUND: "Resource not found",
  VALIDATION_ERROR: "Validation failed",
  INTERNAL_ERROR: "Internal server error",
  DATABASE_ERROR: "Database operation failed",
  RATE_LIMIT_EXCEEDED: "Too many requests, please try again later",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "You do not have permission to perform this action",
  INVALID_CREDENTIALS: "Invalid email or password",
  TOKEN_EXPIRED: "Token has expired",
  TOKEN_INVALID: "Invalid token",
  USER_NOT_FOUND: "User not found",
  EMAIL_EXISTS: "Email already registered",
  PHONE_EXISTS: "Phone number already registered",
};

// Environment
export const NODE_ENV = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
  TEST: "test",
};

// Logging
export const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
};

// User Types
export const USER_TYPES = {
  ADMIN: "admin",
  THERAPIST: "therapist",
  USER: "user",
};

// User Status
export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
  PENDING_VERIFICATION: "pending_verification",
};

// Therapist Status
export const THERAPIST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
  INACTIVE: "inactive",
};

// Booking Status
export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
  RESCHEDULED: "rescheduled",
};

// Session Status
export const SESSION_STATUS = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

// Session Types
export const SESSION_TYPES = {
  VIDEO: "video",
  AUDIO: "audio",
  CHAT: "chat",
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
  EXPIRED: "expired",
};

// Subscription Status
export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
  PAUSED: "paused",
};

// Subscription Types
export const SUBSCRIPTION_TYPES = {
  WEEKLY: "weekly",
  MONTHLY: "monthly",
};

// Document Status
export const DOCUMENT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// Document Types
export const DOCUMENT_TYPES = {
  LICENSE: "license",
  CERTIFICATION: "certification",
  DEGREE: "degree",
  ID_DOCUMENT: "id_document",
};

// Notification Channels
export const NOTIFICATION_CHANNELS = {
  PUSH: "push",
  EMAIL: "email",
  SMS: "sms",
  IN_APP: "in_app",
};

// Notification Status
export const NOTIFICATION_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  DELIVERED: "delivered",
  FAILED: "failed",
};

// Message Types
export const MESSAGE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  FILE: "file",
  SYSTEM: "system",
};

// Question Types
export const QUESTION_TYPES = {
  SINGLE_CHOICE: "single_choice",
  MULTIPLE_CHOICE: "multiple_choice",
  SCALE: "scale",
  TEXT: "text",
};

// OTP Purpose
export const OTP_PURPOSE = {
  REGISTRATION: "registration",
  LOGIN: "login",
  PASSWORD_RESET: "password_reset",
  PHONE_VERIFICATION: "phone_verification",
};

// Days of Week
export const DAYS_OF_WEEK = {
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
  SUNDAY: "sunday",
};

// Gender Options
export const GENDERS = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
  PREFER_NOT_TO_SAY: "prefer_not_to_say",
};

// Supported Languages
export const SUPPORTED_LANGUAGES = {
  EN: "en",
  AR: "ar",
  KU: "ku",
};

// Auth Providers
export const AUTH_PROVIDERS = {
  EMAIL: "email",
  PHONE: "phone",
  GOOGLE: "google",
  APPLE: "apple",
};

// Payout Status
export const PAYOUT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  PAID: "paid",
  FAILED: "failed",
};

// Cancelled By
export const CANCELLED_BY = {
  USER: "user",
  THERAPIST: "therapist",
  ADMIN: "admin",
  SYSTEM: "system",
};

// Actor Types (for audit logs)
export const ACTOR_TYPES = {
  USER: "user",
  THERAPIST: "therapist",
  ADMIN: "admin",
  SYSTEM: "system",
};

// Default values
export const DEFAULTS = {
  SESSION_DURATION_MINUTES: 50,
  CURRENCY: "USD",
  TIMEZONE: "UTC",
  LANGUAGE: "en",
};

// JWT Configuration
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRES_IN: "15m",
  REFRESH_TOKEN_EXPIRES_IN: "7d",
};

// OTP Configuration
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRES_IN_MINUTES: 10,
  MAX_ATTEMPTS: 3,
};

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ALLOWED_DOCUMENT_TYPES: ["application/pdf", "image/jpeg", "image/png"],
};
