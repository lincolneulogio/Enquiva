-- Copilot: historial, feedback y corpus RAG (embeddings en jsonb; pgvector opcional)
CREATE TABLE IF NOT EXISTS "chat_conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "title" text,
  "path_context" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "citations" jsonb,
  "intent" text,
  "model_id" text,
  "tools_used" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "chat_feedback" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid,
  "message_id" text NOT NULL,
  "user_id" text NOT NULL,
  "rating" integer NOT NULL,
  "query" text,
  "citations" jsonb,
  "intent" text,
  "tools_used" jsonb,
  "model_id" text,
  "note" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "knowledge_chunks" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "text" text NOT NULL,
  "kind" text NOT NULL,
  "module_id" integer,
  "module_name" text,
  "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "embedding" jsonb,
  "embedding_model" text,
  "synced_at" timestamp DEFAULT now() NOT NULL,
  "active" boolean DEFAULT true NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "chat_conversations"
    ADD CONSTRAINT "chat_conversations_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "chat_messages"
    ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk"
    FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "chat_feedback"
    ADD CONSTRAINT "chat_feedback_conversation_id_chat_conversations_id_fk"
    FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "chat_feedback"
    ADD CONSTRAINT "chat_feedback_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "chat_conversations_user_idx" ON "chat_conversations" ("user_id");
CREATE INDEX IF NOT EXISTS "chat_conversations_updated_idx" ON "chat_conversations" ("updated_at");
CREATE INDEX IF NOT EXISTS "chat_messages_conversation_idx" ON "chat_messages" ("conversation_id");
CREATE INDEX IF NOT EXISTS "chat_feedback_user_idx" ON "chat_feedback" ("user_id");
CREATE INDEX IF NOT EXISTS "chat_feedback_message_idx" ON "chat_feedback" ("message_id");
CREATE INDEX IF NOT EXISTS "knowledge_chunks_kind_idx" ON "knowledge_chunks" ("kind");
