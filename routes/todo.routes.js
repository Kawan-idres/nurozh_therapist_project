import express from "express";
import {
  getAllTodos,
  createNewTodo,
  updateTodoById,
  deleteTodoById,
} from "../controllers/todo.controller.js";
import {
  validateCreateTodo,
  validateUpdateTodo,
  validateTodoId,
} from "../middleware/validation.js";

const router = express.Router();

router.get("/", getAllTodos);
router.post("/", validateCreateTodo, createNewTodo);
router.put("/:id", validateTodoId, validateUpdateTodo, updateTodoById);
router.delete("/:id", validateTodoId, deleteTodoById);

export default router;
