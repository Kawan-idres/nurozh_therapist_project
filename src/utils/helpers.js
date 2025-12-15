import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from "../config/constants.js";

/**
 * Build pagination response object
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items count
 * @returns {Object} Pagination metadata
 */
export const buildPaginationResponse = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
};

/**
 * Parse pagination params from query
 * @param {Object} query - Request query object
 * @returns {Object} Parsed pagination { page, limit, skip }
 */
export const parsePaginationParams = (query) => {
  let page = parseInt(query.page, 10) || DEFAULT_PAGE;
  let limit = parseInt(query.limit, 10) || DEFAULT_LIMIT;

  // Ensure valid bounds
  page = Math.max(1, page);
  limit = Math.min(Math.max(1, limit), MAX_LIMIT);

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Build success response
 * @param {Object} data - Response data
 * @param {string} message - Optional message
 * @returns {Object} Formatted success response
 */
export const successResponse = (data, message = null) => {
  const response = { success: true, data };
  if (message) {
    response.message = message;
  }
  return response;
};

/**
 * Build paginated success response
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination metadata
 * @returns {Object} Formatted paginated response
 */
export const paginatedResponse = (data, pagination) => {
  return {
    success: true,
    data,
    pagination,
  };
};

/**
 * Remove sensitive fields from user object
 * @param {Object} user - User object
 * @returns {Object} User without sensitive fields
 */
export const sanitizeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...sanitized } = user;
  return sanitized;
};

/**
 * Remove sensitive fields from therapist object
 * @param {Object} therapist - Therapist object
 * @returns {Object} Therapist without sensitive fields
 */
export const sanitizeTherapist = (therapist) => {
  if (!therapist) return null;
  const { password_hash, ...sanitized } = therapist;
  return sanitized;
};

/**
 * Remove sensitive fields from admin object
 * @param {Object} admin - Admin object
 * @returns {Object} Admin without sensitive fields
 */
export const sanitizeAdmin = (admin) => {
  if (!admin) return null;
  const { password_hash, ...sanitized } = admin;
  return sanitized;
};

/**
 * Get localized value from multilingual JSON field
 * @param {Object} field - Multilingual field { en: "...", ar: "...", ku: "..." }
 * @param {string} lang - Language code (default: "en")
 * @returns {string|null} Localized value or null
 */
export const getLocalizedValue = (field, lang = "en") => {
  if (!field) return null;
  return field[lang] || field.en || Object.values(field)[0] || null;
};

/**
 * Build multilingual field object
 * @param {string} en - English value
 * @param {string} ar - Arabic value (optional)
 * @param {string} ku - Kurdish value (optional)
 * @returns {Object} Multilingual object
 */
export const buildMultilingualField = (en, ar = null, ku = null) => {
  const field = { en };
  if (ar) field.ar = ar;
  if (ku) field.ku = ku;
  return field;
};

/**
 * Generate OTP code
 * @param {number} length - OTP length (default: 6)
 * @returns {string} OTP code
 */
export const generateOTP = (length = 6) => {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

/**
 * Check if a date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if in the past
 */
export const isDateInPast = (date) => {
  return new Date(date) < new Date();
};

/**
 * Check if a date is in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if in the future
 */
export const isDateInFuture = (date) => {
  return new Date(date) > new Date();
};

/**
 * Format date to ISO string without time
 * @param {Date|string} date - Date to format
 * @returns {string} Date string (YYYY-MM-DD)
 */
export const formatDateOnly = (date) => {
  return new Date(date).toISOString().split("T")[0];
};

/**
 * Calculate duration in minutes between two dates
 * @param {Date|string} start - Start date
 * @param {Date|string} end - End date
 * @returns {number} Duration in minutes
 */
export const calculateDurationMinutes = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.round((endDate - startDate) / (1000 * 60));
};

/**
 * Parse time string to minutes from midnight
 * @param {string} timeString - Time string (HH:MM)
 * @returns {number} Minutes from midnight
 */
export const parseTimeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * Check if two time ranges overlap
 * @param {Object} range1 - { start: "HH:MM", end: "HH:MM" }
 * @param {Object} range2 - { start: "HH:MM", end: "HH:MM" }
 * @returns {boolean} True if ranges overlap
 */
export const timeRangesOverlap = (range1, range2) => {
  const start1 = parseTimeToMinutes(range1.start);
  const end1 = parseTimeToMinutes(range1.end);
  const start2 = parseTimeToMinutes(range2.start);
  const end2 = parseTimeToMinutes(range2.end);

  return start1 < end2 && start2 < end1;
};

/**
 * Pick specified keys from object
 * @param {Object} obj - Source object
 * @param {Array<string>} keys - Keys to pick
 * @returns {Object} New object with picked keys
 */
export const pick = (obj, keys) => {
  return keys.reduce((acc, key) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Omit specified keys from object
 * @param {Object} obj - Source object
 * @param {Array<string>} keys - Keys to omit
 * @returns {Object} New object without omitted keys
 */
export const omit = (obj, keys) => {
  return Object.keys(obj)
    .filter((key) => !keys.includes(key))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
};

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === "object" && Object.keys(value).length === 0) return true;
  return false;
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
