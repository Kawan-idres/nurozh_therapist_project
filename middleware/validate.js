import { ValidationError } from "../utils/errors.js";

/**
 * Generic validation middleware factory using Zod schemas
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        throw new ValidationError("Validation failed", errors);
      }

      // Replace req data with validated and transformed data
      if (result.data.body) {
        req.body = result.data.body;
      }
      if (result.data.query) {
        // Copy validated query properties to req.query
        Object.keys(result.data.query).forEach((key) => {
          req.query[key] = result.data.query[key];
        });
      }
      if (result.data.params) {
        // Copy validated param properties to req.params
        Object.keys(result.data.params).forEach((key) => {
          req.params[key] = result.data.params[key];
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
