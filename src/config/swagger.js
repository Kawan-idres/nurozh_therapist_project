import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { env } from "./env.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Nurozh Therapy Platform API",
      version: "1.0.0",
      description:
        "A comprehensive therapy and mental health platform API with Express.js, Prisma ORM, and PostgreSQL",
      contact: {
        name: "Nurozh Support",
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
      { name: "Health", description: "Health check endpoints" },
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Users", description: "User management endpoints" },
      { name: "Therapists", description: "Therapist management endpoints" },
      { name: "Admin", description: "Admin management endpoints" },
      { name: "Bookings", description: "Booking management endpoints" },
      { name: "Sessions", description: "Session management endpoints" },
      { name: "Payments", description: "Payment management endpoints" },
      { name: "Conversations", description: "Conversation and messaging endpoints" },
      { name: "Questionnaires", description: "Questionnaire management endpoints" },
      { name: "Specialties", description: "Specialty management endpoints" },
      { name: "Subscriptions", description: "Subscription management endpoints" },
      { name: "Uploads", description: "File upload endpoints" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      schemas: {
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
                type: "object",
              },
            },
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 10 },
                total: { type: "integer", example: 50 },
                totalPages: { type: "integer", example: 5 },
                hasMore: { type: "boolean", example: true },
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
                      field: { type: "string" },
                      message: { type: "string" },
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
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "user@example.com" },
            password: { type: "string", format: "password", example: "password123" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                accessToken: { type: "string" },
                refreshToken: { type: "string" },
                user: { type: "object" },
              },
            },
          },
        },
        MultilingualField: {
          type: "object",
          properties: {
            en: { type: "string", example: "English text" },
            ar: { type: "string", example: "Arabic text" },
            ku: { type: "string", example: "Kurdish text" },
          },
        },
      },
      parameters: {
        Page: {
          name: "page",
          in: "query",
          schema: { type: "integer", minimum: 1, default: 1 },
          description: "Page number",
        },
        Limit: {
          name: "limit",
          in: "query",
          schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          description: "Number of items per page",
        },
        Id: {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Resource UUID",
        },
      },
    },
  },
  apis: ["./src/*.js", "./src/modules/**/*.routes.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
export const swaggerUiOptions = {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Nurozh API Docs",
};

export { swaggerUi };
