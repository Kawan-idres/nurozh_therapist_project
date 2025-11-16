export const validateCreateTodo = (req, res, next) => {
  const { title } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({
      error: "Validation failed",
      message: "Title is required and must be a non-empty string",
    });
  }

  // Trim and sanitize the title
  req.body.title = title.trim();

  next();
};

export const validateUpdateTodo = (req, res, next) => {
  const { title, completed } = req.body;

  // Check if at least one field is provided
  if (title === undefined && completed === undefined) {
    return res.status(400).json({
      error: "Validation failed",
      message: "At least one field (title or completed) must be provided",
    });
  }

  // Validate title if provided
  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        error: "Validation failed",
        message: "Title must be a non-empty string",
      });
    }
    req.body.title = title.trim();
  }

  // Validate completed if provided
  if (completed !== undefined && typeof completed !== "boolean") {
    return res.status(400).json({
      error: "Validation failed",
      message: "Completed must be a boolean value",
    });
  }

  next();
};

export const validateTodoId = (req, res, next) => {
  const { id } = req.params;
  const numericId = Number(id);

  if (isNaN(numericId) || numericId <= 0 || !Number.isInteger(numericId)) {
    return res.status(400).json({
      error: "Validation failed",
      message: "ID must be a positive integer",
    });
  }

  next();
};
