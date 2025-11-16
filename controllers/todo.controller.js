import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "../services/todo.service.js";

export const getAllTodos = async (req, res, next) => {
  try {
    const todos = await getTodos();
    res.json(todos);
  } catch (error) {
    next(error);
  }
};

export const createNewTodo = async (req, res, next) => {
  try {
    const { title } = req.body;
    const todo = await createTodo({ title });
    res.status(201).json(todo);
  } catch (error) {
    next(error);
  }
};

export const updateTodoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    const updated = await updateTodo(id, { title, completed });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteTodoById = async (req, res, next) => {
  try {
    const { id } = req.params;

    await deleteTodo(id);
    res.json({ message: "Todo deleted successfully" });
  } catch (error) {
    next(error);
  }
};
