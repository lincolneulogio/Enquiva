ALTER TYPE "public"."broadcast_job_status" ADD VALUE IF NOT EXISTS 'retry' BEFORE 'processing';

ALTER TABLE "broadcast_jobs"
  ADD COLUMN IF NOT EXISTS "attempts" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "max_attempts" integer DEFAULT 5 NOT NULL,
  ADD COLUMN IF NOT EXISTS "next_attempt_at" timestamp DEFAULT now() NOT NULL,
  ADD COLUMN IF NOT EXISTS "locked_at" timestamp;

ALTER TABLE "broadcast_logs" ADD COLUMN IF NOT EXISTS "job_id" uuid;
ALTER TABLE "broadcast_logs"
  ADD CONSTRAINT "broadcast_logs_job_id_broadcast_jobs_id_fk"
  FOREIGN KEY ("job_id") REFERENCES "public"."broadcast_jobs"("id") ON DELETE SET NULL;
CREATE UNIQUE INDEX "broadcast_logs_job_id_unique" ON "broadcast_logs" ("job_id");

UPDATE "broadcast_jobs"
SET "locked_at" = COALESCE("started_at", "created_at")
WHERE "status" = 'processing' AND "locked_at" IS NULL;

CREATE TYPE "public"."broadcast_delivery_channel" AS ENUM ('email', 'in_app', 'pusher');

CREATE TABLE "broadcast_job_deliveries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "job_id" uuid NOT NULL,
  "recipient_id" text NOT NULL,
  "channel" "broadcast_delivery_channel" NOT NULL,
  "status" text DEFAULT 'processing' NOT NULL,
  "attempts" integer DEFAULT 1 NOT NULL,
  "locked_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp,
  "error_message" text,
  CONSTRAINT "broadcast_job_deliveries_job_id_broadcast_jobs_id_fk"
    FOREIGN KEY ("job_id") REFERENCES "public"."broadcast_jobs"("id") ON DELETE CASCADE,
  CONSTRAINT "broadcast_job_deliveries_recipient_id_users_id_fk"
    FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

CREATE TABLE "broadcast_job_recipients" (
  "job_id" uuid NOT NULL,
  "recipient_id" text NOT NULL,
  "name" text,
  "email" text NOT NULL,
  CONSTRAINT "broadcast_job_recipients_job_id_broadcast_jobs_id_fk"
    FOREIGN KEY ("job_id") REFERENCES "public"."broadcast_jobs"("id") ON DELETE CASCADE,
  CONSTRAINT "broadcast_job_recipients_recipient_id_users_id_fk"
    FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "broadcast_job_recipients_job_recipient_unique_idx"
  ON "broadcast_job_recipients" ("job_id", "recipient_id");
CREATE UNIQUE INDEX "broadcast_job_deliveries_job_recipient_channel_unique_idx"
  ON "broadcast_job_deliveries" ("job_id", "recipient_id", "channel");
CREATE INDEX "broadcast_job_deliveries_job_status_idx"
  ON "broadcast_job_deliveries" ("job_id", "status");
CREATE INDEX "broadcast_jobs_status_next_attempt_idx"
  ON "broadcast_jobs" ("status", "next_attempt_at");
DROP INDEX IF EXISTS "broadcast_jobs_status_idx";
