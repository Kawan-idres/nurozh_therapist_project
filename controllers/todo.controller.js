import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "../services/todo.service.js";


export const getAllTodos = async (req, res) => {
  const todos = await getTodos();
  res.json(todos);
};

export const createNewTodo = async (req, res) => {
  const { title } = req.body;
  const todo = await createTodo({ title });
  res.json(todo);
};

export const updateTodoById = async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  const updated = await updateTodo(id, { title, completed });
  res.json(updated);
};

export const deleteTodoById = async (req, res) => {
  const { id } = req.params;

  await deleteTodo(id);
  res.json({ message: "Todo deleted" });
};
