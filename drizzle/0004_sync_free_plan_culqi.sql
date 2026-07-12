-- Ensure Free (and other default plan slugs) have Culqi enabled to match DEFAULT_PLAN_DEFINITIONS.
-- Idempotent: safe to re-run. Runtime upsert via ensureDefaultPlans also syncs on Admin → Planes.

UPDATE "plans"
SET
  "feature_culqi" = true,
  "updated_at" = NOW()
WHERE "slug" IN ('free', 'pro', 'enterprise')
  AND "feature_culqi" IS DISTINCT FROM true;
