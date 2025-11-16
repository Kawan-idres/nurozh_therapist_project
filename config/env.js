import "dotenv/config";
import { z } from "zod";
import { NODE_ENV } from "./constants.js";

// Define environment variable schema
const envSchema = z.object({
  NODE_ENV: z
    .enum([NODE_ENV.DEVELOPMENT, NODE_ENV.PRODUCTION, NODE_ENV.TEST])
    .default(NODE_ENV.DEVELOPMENT),
  PORT: z
    .string()
    .regex(/^\d+$/, "PORT must be a number")
    .transform(Number)
    .default("3000"),
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid URL")
    .min(1, "DATABASE_URL is required"),
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
