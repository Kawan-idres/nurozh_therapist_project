import "dotenv/config";
import { z } from "zod";
import { NODE_ENV } from "./constants.js";

// Define environment variable schema
const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum([NODE_ENV.DEVELOPMENT, NODE_ENV.PRODUCTION, NODE_ENV.TEST])
    .default(NODE_ENV.DEVELOPMENT),
  PORT: z
    .string()
    .regex(/^\d+$/, "PORT must be a number")
    .transform(Number)
    .default("3000"),

  // Database
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid URL")
    .min(1, "DATABASE_URL is required"),

  // JWT
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters")
    .default("your-super-secret-access-key-change-in-production"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters")
    .default("your-super-secret-refresh-key-change-in-production"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Bunny CDN (optional in development)
  BUNNY_CDN_STORAGE_ZONE: z.string().optional(),
  BUNNY_CDN_API_KEY: z.string().optional(),
  BUNNY_CDN_PULL_ZONE_URL: z.string().url().optional(),

  // Logging
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "debug"])
    .default("info")
    .optional(),
});

// Validate environment variables
const validateEnv = () => {
  try {
    const validated = envSchema.parse(process.env);
    return validated;
  } catch (error) {
    console.error("❌ Environment validation failed:");
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
    }
    process.exit(1);
  }
};

// Export validated environment variables
export const env = validateEnv();
