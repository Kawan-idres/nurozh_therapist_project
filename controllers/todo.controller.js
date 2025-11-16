import {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
} from "../services/todo.service.js";
import {
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
} from "../config/constants.js";
import logger from "../config/logger.js";

/**
 * Get all todos with pagination
 */
export const getAllTodos = async (req, res, next) => {
  try {
    // Get validated and transformed query params (or use defaults)
    const page = req.query.page ? parseInt(req.query.page, 10) : DEFAULT_PAGE;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : DEFAULT_LIMIT;

    const result = await getTodos({ page, limit });

    logger.info("Fetched todos", {
      requestId: req.id,
      page: result.pagination.page,
      total: result.pagination.total,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single todo by ID
 */
export const getTodo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const todo = await getTodoById(id);

    logger.info("Fetched todo", { requestId: req.id, todoId: id });

    res.json({
      success: true,
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new todo
 */
export const createNewTodo = async (req, res, next) => {
  try {
    const { title } = req.body;

    const todo = await createTodo({ title });

    logger.info("Created todo", { requestId: req.id, todoId: todo.id });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.TODO_CREATED,
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a todo by ID
 */
export const updateTodoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    // Filter out undefined values
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (completed !== undefined) updateData.completed = completed;

    const updated = await updateTodo(id, updateData);

    logger.info("Updated todo", { requestId: req.id, todoId: id });

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.TODO_UPDATED,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a todo by ID
 */
export const deleteTodoById = async (req, res, next) => {
  try {
    const { id } = req.params;

    await deleteTodo(id);

    logger.info("Deleted todo", { requestId: req.id, todoId: id });

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.TODO_DELETED,
    });
  } catch (error) {
    next(error);
  }
};
