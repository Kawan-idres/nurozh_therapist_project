import { z } from "zod";

/**
 * Schema for creating a new conversation
 */
export const createConversationSchema = z.object({
  body: z.object({
    therapist_id: z.union([
      z.number().int().positive("Therapist ID must be a positive integer"),
      z.string().regex(/^\d+$/, "Therapist ID must be a valid number").transform(Number),
    ]).optional(),
    user_id: z.union([
      z.number().int().positive("User ID must be a positive integer"),
      z.string().regex(/^\d+$/, "User ID must be a valid number").transform(Number),
    ]).optional(),
  }).refine(
    (data) => data.therapist_id || data.user_id,
    { message: "Either therapist_id or user_id is required" },
  ),
});

/**
 * Schema for sending a message
 */
export const sendMessageSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Conversation ID must be a valid number").transform(Number),
  }),
  body: z.object({
    content: z.string()
      .min(1, "Message content cannot be empty")
      .max(5000, "Message content cannot exceed 5000 characters"),
    message_type: z.enum(["text", "image", "file"]).default("text"),
  }),
});

/**
 * Schema for getting messages with pagination
 */
export const getMessagesSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Conversation ID must be a valid number").transform(Number),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }).optional(),
});

/**
 * Schema for getting a single conversation
 */
export const getConversationSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Conversation ID must be a valid number").transform(Number),
  }),
});

/**
 * Schema for marking conversation as read
 */
export const markReadSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Conversation ID must be a valid number").transform(Number),
  }),
});

/**
 * Schema for deleting a message
 */
export const deleteMessageSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Conversation ID must be a valid number").transform(Number),
    messageId: z.string().regex(/^\d+$/, "Message ID must be a valid number").transform(Number),
  }),
});
