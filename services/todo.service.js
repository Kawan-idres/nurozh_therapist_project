import prisma from "../config/prisma.js";

export const getTodos = () => {
  return prisma.todo.findMany();
};

export const createTodo = (data) => {
  return prisma.todo.create({ data });
};

export const updateTodo = (id, data) => {
  return prisma.todo.update({
    where: { id: Number(id) },
    data,
  });
};

export const deleteTodo = (id) => {
  return prisma.todo.delete({
    where: { id: Number(id) },
  });
};
    