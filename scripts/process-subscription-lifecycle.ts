/**
 * Procesa vencimientos de suscripción: past_due, downgrade a Free, renovación Free.
 * Ejecutar diariamente: pnpm run jobs:subscriptions
 */
import { SubscriptionService } from "@/lib/billing/subscription.service";

async function main() {
  console.log("Processing subscription lifecycle...");
  const result = await SubscriptionService.processSubscriptionLifecycle();
  console.log("Done:", result);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Job failed:", err);
    process.exit(1);
  });
