ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "pending_plan_id" uuid,
  ADD COLUMN IF NOT EXISTS "pending_plan_effective_at" timestamp;

DO $$ BEGIN
  ALTER TABLE "subscriptions"
    ADD CONSTRAINT "subscriptions_pending_plan_id_plans_id_fk"
    FOREIGN KEY ("pending_plan_id") REFERENCES "public"."plans"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "subscriptions_pending_plan_idx"
  ON "subscriptions" ("pending_plan_id", "pending_plan_effective_at");
