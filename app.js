import express from "express";
import cors from "cors";
import todoRoutes from "./routes/todo.routes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/todos", todoRoutes);

export default app;
