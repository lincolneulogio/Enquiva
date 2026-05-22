-- Add signature column to tickets and create ticket_scan_logs for audit
ALTER TABLE IF EXISTS "tickets" ADD COLUMN IF NOT EXISTS "signature" text;

CREATE TABLE IF NOT EXISTS "ticket_scan_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "ticket_id" uuid NOT NULL,
  "scanned_by" text,
  "ip_address" text,
  "user_agent" text,
  "result" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ticket_scan_logs_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets" ("id") ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS "ticket_scan_logs_ticket_idx" ON "ticket_scan_logs" USING btree ("ticket_id");
