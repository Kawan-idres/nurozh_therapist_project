import express from "express";
import {
  getAllTodos,
  getTodo,
  createNewTodo,
  updateTodoById,
  deleteTodoById,
} from "../controllers/todo.controller.js";
import { validate } from "../middleware/validate.js";
import {
  queryPaginationSchema,
  getTodoByIdSchema,
  createTodoSchema,
  updateTodoSchema,
  deleteTodoSchema,
} from "../schemas/todo.schema.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/todos:
 *   get:
 *     summary: Get all todos
 *     description: Retrieve a paginated list of todos
 *     tags: [Todos]
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200:
 *         description: Successfully retrieved todos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", validate(queryPaginationSchema), getAllTodos);

/**
 * @swagger
 * /api/v1/todos/{id}:
 *   get:
 *     summary: Get a todo by ID
 *     description: Retrieve a single todo item by its ID
 *     tags: [Todos]
 *     parameters:
 *       - $ref: '#/components/parameters/TodoId'
 *     responses:
 *       200:
 *         description: Successfully retrieved todo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Todo not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", validate(getTodoByIdSchema), getTodo);

/**
 * @swagger
 * /api/v1/todos:
 *   post:
 *     summary: Create a new todo
 *     description: Create a new todo item
 *     tags: [Todos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTodoRequest'
 *     responses:
 *       201:
 *         description: Todo created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Todo'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", validate(createTodoSchema), createNewTodo);

/**
 * @swagger
 * /api/v1/todos/{id}:
 *   put:
 *     summary: Update a todo
 *     description: Update an existing todo item
 *     tags: [Todos]
 *     parameters:
 *       - $ref: '#/components/parameters/TodoId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTodoRequest'
 *     responses:
 *       200:
 *         description: Todo updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Todo'
 *       404:
 *         description: Todo not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/:id", validate(updateTodoSchema), updateTodoById);

/**
 * @swagger
 * /api/v1/todos/{id}:
 *   delete:
 *     summary: Delete a todo
 *     description: Delete a todo item by ID
 *     tags: [Todos]
 *     parameters:
 *       - $ref: '#/components/parameters/TodoId'
 *     responses:
 *       200:
 *         description: Todo deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Todo deleted successfully
 *       404:
 *         description: Todo not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", validate(deleteTodoSchema), deleteTodoById);

export default router;
