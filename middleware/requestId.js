import { v4 as uuidv4 } from "uuid";

/**
 * Middleware to add a unique request ID to each request
 * This helps with tracking and debugging requests across logs
 */
export const requestId = (req, res, next) => {
  // Use existing request ID from header or generate new one
  const id = req.headers["x-request-id"] || uuidv4();

  // Attach to request object
  req.id = id;

  // Add to response headers
  res.setHeader("X-Request-ID", id);

  next();
};
