import express from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";
import { securityHeaders, rateLimiter } from "./middleware/security.js";
import { requestId } from "./middleware/requestId.js";
import logger from "./config/logger.js";
import {
  swaggerUi,
  swaggerSpec,
  swaggerUiOptions,
} from "./config/swagger.js";
import { API_PREFIX } from "./config/constants.js";

// Import routes
import healthRoutes from "./health.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import therapistRoutes from "./modules/therapists/therapist.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import bookingRoutes from "./modules/bookings/booking.routes.js";
import sessionRoutes from "./modules/sessions/session.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import conversationRoutes from "./modules/conversations/conversation.routes.js";
import questionnaireRoutes from "./modules/questionnaires/questionnaire.routes.js";
import specialtyRoutes from "./modules/specialties/specialty.routes.js";
import subscriptionRoutes from "./modules/subscriptions/subscription.routes.js";
import uploadRoutes from "./modules/uploads/upload.routes.js";

const app = express();

// Trust proxy (if behind reverse proxy like Nginx)
app.set("trust proxy", 1);

// Security middleware
app.use(securityHeaders);
app.use(rateLimiter);

// Request tracking
app.use(requestId);

// HTTP request logging
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// CORS
app.use(cors());

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Response compression
app.use(compression());

// Health check (before API versioning)
app.use("/health", healthRoutes);

// API Documentation
app.use("/api-docs", swaggerUi.serve);
app.get("/api-docs", swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Welcome route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Nurozh Therapy Platform API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      documentation: "/api-docs",
      api: API_PREFIX,
    },
  });
});

// API Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/therapists`, therapistRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/bookings`, bookingRoutes);
app.use(`${API_PREFIX}/sessions`, sessionRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/conversations`, conversationRoutes);
app.use(`${API_PREFIX}/questionnaires`, questionnaireRoutes);
app.use(`${API_PREFIX}/specialties`, specialtyRoutes);
app.use(`${API_PREFIX}/subscriptions`, subscriptionRoutes);
app.use(`${API_PREFIX}/uploads`, uploadRoutes);

// Error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
