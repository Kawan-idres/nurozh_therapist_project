import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";
import { NotFoundError, DatabaseError } from "../utils/errors.js";
import logger from "../config/logger.js";

/**
 * Get all todos with pagination
 */
export const getTodos = async ({ page = 1, limit = 10 } = {}) => {
  try {
    const skip = (page - 1) * limit;

    const [todos, total] = await Promise.all([
      prisma.todo.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.todo.count(),
    ]);

    return {
      data: todos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  } catch (error) {
    logger.error("Error fetching todos", { error });
    throw new DatabaseError("Failed to fetch todos");
  }
};

/**
 * Get a single todo by ID
 */
export const getTodoById = async (id) => {
  try {
    const todo = await prisma.todo.findUnique({
      where: { id: Number(id) },
    });

    if (!todo) {
      throw new NotFoundError(`Todo with ID ${id} not found`);
    }

    return todo;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error("Error fetching todo by ID", { id, error });
    throw new DatabaseError("Failed to fetch todo");
  }
};

/**
 * Create a new todo
 */
export const createTodo = async (data) => {
  try {
    return await prisma.todo.create({ data });
  } catch (error) {
    logger.error("Error creating todo", { data, error });
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(`Failed to create todo: ${error.message}`);
    }
    throw new DatabaseError("Failed to create todo");
  }
};

/**
 * Update a todo by ID
 */
export const updateTodo = async (id, data) => {
  try {
    return await prisma.todo.update({
      where: { id: Number(id) },
      data,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new NotFoundError(`Todo with ID ${id} not found`);
      }
      logger.error("Error updating todo", { id, data, error });
      throw new DatabaseError(`Failed to update todo: ${error.message}`);
    }
    logger.error("Error updating todo", { id, data, error });
    throw new DatabaseError("Failed to update todo");
  }
};

/**
 * Delete a todo by ID
 */
export const deleteTodo = async (id) => {
  try {
    return await prisma.todo.delete({
      where: { id: Number(id) },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new NotFoundError(`Todo with ID ${id} not found`);
      }
      logger.error("Error deleting todo", { id, error });
      throw new DatabaseError(`Failed to delete todo: ${error.message}`);
    }
    logger.error("Error deleting todo", { id, error });
    throw new DatabaseError("Failed to delete todo");
  }
};
    