import { z } from "zod";

// Common email schema
const emailSchema = z.string().email("Invalid email format").toLowerCase().trim();

// Common password schema
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be at most 100 characters");

// User registration schema
export const userRegisterSchema = z.object({
  body: z.object({
    email: emailSchema.optional(),
    phone: z.string().min(10).max(20).optional(),
    password: passwordSchema,
    first_name: z.string().min(2).max(100),
    last_name: z.string().min(2).max(100),
    date_of_birth: z.string().datetime().optional(),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
    preferred_language: z.enum(["en", "ar", "ku"]).default("en"),
    timezone: z.string().default("UTC"),
  }).refine(
    (data) => data.email || data.phone,
    { message: "Either email or phone is required" }
  ),
});

// Therapist registration schema
export const therapistRegisterSchema = z.object({
  body: z.object({
    email: emailSchema,
    phone: z.string().min(10).max(20).optional(),
    password: passwordSchema,
    first_name: z.string().min(2).max(100),
    last_name: z.string().min(2).max(100),
    date_of_birth: z.string().datetime().optional(),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
    bio: z.object({
      en: z.string().optional(),
      ar: z.string().optional(),
      ku: z.string().optional(),
    }).optional(),
    title: z.object({
      en: z.string().optional(),
      ar: z.string().optional(),
      ku: z.string().optional(),
    }).optional(),
    years_of_experience: z.number().int().min(0).optional(),
    license_number: z.string().max(100).optional(),
    spoken_languages: z.array(z.string()).optional(),
    preferred_language: z.enum(["en", "ar", "ku"]).default("en"),
    timezone: z.string().default("UTC"),
    session_rate_amount: z.number().min(0).optional(),
    session_rate_currency: z.string().length(3).default("USD"),
    session_duration_minutes: z.number().int().min(15).max(120).default(50),
    specialty_ids: z.array(z.number().int().positive()).optional(),
  }),
});

// Admin login schema
export const adminLoginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
  }),
});

// User login schema (email or phone)
export const userLoginSchema = z.object({
  body: z.object({
    email: emailSchema.optional(),
    phone: z.string().min(10).max(20).optional(),
    password: z.string().min(1, "Password is required"),
  }).refine(
    (data) => data.email || data.phone,
    { message: "Either email or phone is required" }
  ),
});

// Therapist login schema
export const therapistLoginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
  }),
});

// Refresh token schema
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

// Change password schema
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  }).refine(
    (data) => data.newPassword === data.confirmPassword,
    { message: "Passwords do not match", path: ["confirmPassword"] }
  ),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema.optional(),
    phone: z.string().min(10).max(20).optional(),
    userType: z.enum(["user", "therapist"]).default("user"),
  }).refine(
    (data) => data.email || data.phone,
    { message: "Either email or phone is required" }
  ),
});

// Reset password schema
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  }).refine(
    (data) => data.password === data.confirmPassword,
    { message: "Passwords do not match", path: ["confirmPassword"] }
  ),
});

// Verify OTP schema
export const verifyOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(10).max(20),
    otp: z.string().length(6, "OTP must be 6 digits"),
    purpose: z.enum(["registration", "login", "password_reset", "phone_verification"]),
  }),
});

// Request OTP schema
export const requestOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(10).max(20),
    purpose: z.enum(["registration", "login", "password_reset", "phone_verification"]),
  }),
});
