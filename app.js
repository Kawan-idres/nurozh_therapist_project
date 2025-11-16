import express from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import todoRoutes from "./routes/todo.routes.js";
import healthRoutes from "./routes/health.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";
import { securityHeaders, rateLimiter } from "./middleware/security.js";
import { requestId } from "./middleware/requestId.js";
import { API_PREFIX } from "./config/constants.js";
import logger from "./config/logger.js";
import {
  swaggerUi,
  swaggerSpec,
  swaggerUiOptions,
} from "./config/swagger.js";

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

// API routes with versioning
app.use(`${API_PREFIX}/todos`, todoRoutes);

// Welcome route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Todo API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      todos: `${API_PREFIX}/todos`,
      documentation: "/api-docs",
    },
  });
});

// Error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
