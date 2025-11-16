import express from "express";
import cors from "cors";
import todoRoutes from "./routes/todo.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/todos", todoRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
