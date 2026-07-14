import {
  pgTable,
  text,
  timestamp,
  uuid,
  index,
  integer,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const chatConversations = pgTable(
  "chat_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title"),
    pathContext: text("path_context"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("chat_conversations_user_idx").on(t.userId),
    index("chat_conversations_updated_idx").on(t.updatedAt),
  ],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => chatConversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    citations: jsonb("citations").$type<string[]>(),
    intent: text("intent"),
    modelId: text("model_id"),
    toolsUsed: jsonb("tools_used").$type<string[]>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("chat_messages_conversation_idx").on(t.conversationId)],
);

export const chatFeedback = pgTable(
  "chat_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").references(() => chatConversations.id, {
      onDelete: "set null",
    }),
    messageId: text("message_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1 = up, -1 = down
    query: text("query"),
    citations: jsonb("citations").$type<string[]>(),
    intent: text("intent"),
    toolsUsed: jsonb("tools_used").$type<string[]>(),
    modelId: text("model_id"),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("chat_feedback_user_idx").on(t.userId),
    index("chat_feedback_message_idx").on(t.messageId),
  ],
);

/**
 * Corpus RAG persistido.
 * embedding: float[] en jsonb (compatible sin extensión pgvector).
 * Opcional: migrar a vector(768) + CREATE EXTENSION vector en prod.
 */
export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    text: text("text").notNull(),
    kind: text("kind").notNull(),
    moduleId: integer("module_id"),
    moduleName: text("module_name"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    embedding: jsonb("embedding").$type<number[]>(),
    embeddingModel: text("embedding_model"),
    syncedAt: timestamp("synced_at").notNull().defaultNow(),
    active: boolean("active").notNull().default(true),
  },
  (t) => [index("knowledge_chunks_kind_idx").on(t.kind)],
);

export type ChatConversation = typeof chatConversations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type ChatFeedback = typeof chatFeedback.$inferSelect;
