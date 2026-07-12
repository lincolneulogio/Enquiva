/**
 * Upserts Free / Pro / Enterprise from DEFAULT_PLAN_DEFINITIONS.
 * Bootstrap local usa solo plan free (`db:seed:bootstrap`).
 * Uso post-deploy: pnpm run db:sync:plans
 */
import { SubscriptionService } from "../src/lib/billing/subscription.service";

async function main() {
  console.log("Syncing default plans (featureCulqi, limits, prices)...");
  await SubscriptionService.ensureDefaultPlans();
  console.log("Done. Free/Pro/Enterprise now match src/lib/billing/plans.ts.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
