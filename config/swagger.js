import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { env } from "./env.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Todo API Documentation",
      version: "1.0.0",
      description:
        "A production-ready RESTful API for managing todos with Express.js, Prisma ORM, and PostgreSQL",
      contact: {
        name: "API Support",
      },
      license: {
        name: "ISC",
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: "Development server",
      },
    ],
    tags: [
      {
        name: "Health",
        description: "Health check endpoints",
      },
      {
        name: "Todos",
        description: "Todo management endpoints",
      },
    ],
    components: {
      schemas: {
        Todo: {
          type: "object",
          required: ["id", "title", "completed", "createdAt", "updatedAt"],
          properties: {
            id: {
              type: "integer",
              description: "Unique identifier",
              example: 1,
            },
            title: {
              type: "string",
              description: "Todo title",
              example: "Buy groceries",
              minLength: 1,
              maxLength: 255,
            },
            completed: {
              type: "boolean",
              description: "Completion status",
              example: false,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
          },
        },
        CreateTodoRequest: {
          type: "object",
          required: ["title"],
          properties: {
            title: {
              type: "string",
              description: "Todo title",
              example: "Buy groceries",
              minLength: 1,
              maxLength: 255,
            },
          },
        },
        UpdateTodoRequest: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Todo title",
              example: "Buy groceries and cook dinner",
              minLength: 1,
              maxLength: 255,
            },
            completed: {
              type: "boolean",
              description: "Completion status",
              example: true,
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
            },
            message: {
              type: "string",
            },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Todo",
              },
            },
            pagination: {
              type: "object",
              properties: {
                page: {
                  type: "integer",
                  example: 1,
                },
                limit: {
                  type: "integer",
                  example: 10,
                },
                total: {
                  type: "integer",
                  example: 50,
                },
                totalPages: {
                  type: "integer",
                  example: 5,
                },
                hasMore: {
                  type: "boolean",
                  example: true,
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  example: "Validation failed",
                },
                errors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field: {
                        type: "string",
                      },
                      message: {
                        type: "string",
                      },
                    },
                  },
                },
              },
            },
            requestId: {
              type: "string",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
          },
        },
      },
      parameters: {
        TodoId: {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "integer",
            minimum: 1,
          },
          description: "Todo ID",
        },
        Page: {
          name: "page",
          in: "query",
          schema: {
            type: "integer",
            minimum: 1,
            default: 1,
          },
          description: "Page number",
        },
        Limit: {
          name: "limit",
          in: "query",
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 10,
          },
          description: "Number of items per page",
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
export const swaggerUiOptions = {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Todo API Docs",
};

export { swaggerUi };
