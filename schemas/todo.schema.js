import { z } from "zod";
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from "../config/constants.js";

// Schema for creating a todo
export const createTodoSchema = z.object({
  body: z.object({
    title: z
      .string({
        required_error: "Title is required",
        invalid_type_error: "Title must be a string",
      })
      .min(1, "Title cannot be empty")
      .max(255, "Title must be less than 255 characters")
      .trim(),
  }),
});

// Schema for updating a todo
export const updateTodoSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/, "ID must be a positive integer")
      .transform(Number),
  }),
  body: z
    .object({
      title: z
        .string()
        .min(1, "Title cannot be empty")
        .max(255, "Title must be less than 255 characters")
        .trim()
        .optional(),
      completed: z.boolean({
        invalid_type_error: "Completed must be a boolean",
      }).optional(),
    })
    .refine((data) => data.title !== undefined || data.completed !== undefined, {
      message: "At least one field (title or completed) must be provided",
    }),
});

// Schema for getting a single todo by ID
export const getTodoByIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/, "ID must be a positive integer")
      .transform(Number),
  }),
});

// Schema for deleting a todo
export const deleteTodoSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/, "ID must be a positive integer")
      .transform(Number),
  }),
});

// Schema for query parameters (pagination)
export const queryPaginationSchema = z.object({
  query: z
    .object({
      page: z
        .string()
        .optional()
        .default(String(DEFAULT_PAGE))
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val > 0, {
          message: "Page must be a positive integer",
        }),
      limit: z
        .string()
        .optional()
        .default(String(DEFAULT_LIMIT))
        .transform((val) => parseInt(val, 10))
        .refine(
          (val) => !isNaN(val) && val > 0 && val <= MAX_LIMIT,
          {
            message: `Limit must be a positive integer and cannot exceed ${MAX_LIMIT}`,
          }
        ),
    })
    .default({ page: String(DEFAULT_PAGE), limit: String(DEFAULT_LIMIT) }),
});
