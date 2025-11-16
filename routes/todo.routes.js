import express from "express";
import {
  getAllTodos,
  createNewTodo,
  updateTodoById,
  deleteTodoById,
} from "../controllers/todo.controller.js";

const router = express.Router();

router.get("/", getAllTodos);
router.post("/", createNewTodo);
router.put("/:id", updateTodoById);
router.delete("/:id", deleteTodoById);

export default router;
