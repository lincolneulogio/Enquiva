import { SubscriptionService } from "@/lib/billing/subscription.service";

async function main() {
  console.log("Seeding SaaS plans...");
  await SubscriptionService.ensureDefaultPlans();
  console.log("Planes Free, Pro y Enterprise listos.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed plans failed:", err);
  process.exit(1);
});
