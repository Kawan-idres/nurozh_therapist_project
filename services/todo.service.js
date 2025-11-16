import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";

export const getTodos = async () => {
  try {
    return await prisma.todo.findMany();
  } catch (error) {
    throw error;
  }
};

export const createTodo = async (data) => {
  try {
    return await prisma.todo.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Error(`Database error: ${error.message}`);
    }
    throw error;
  }
};

export const updateTodo = async (id, data) => {
  try {
    return await prisma.todo.update({
      where: { id: Number(id) },
      data,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        const err = new Error(`Todo with ID ${id} not found`);
        err.statusCode = 404;
        throw err;
      }
      throw new Error(`Database error: ${error.message}`);
    }
    throw error;
  }
};

export const deleteTodo = async (id) => {
  try {
    return await prisma.todo.delete({
      where: { id: Number(id) },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        const err = new Error(`Todo with ID ${id} not found`);
        err.statusCode = 404;
        throw err;
      }
      throw new Error(`Database error: ${error.message}`);
    }
    throw error;
  }
};
    