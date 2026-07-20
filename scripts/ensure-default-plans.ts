/**
 * Deja solo los planes canónicos:
 * - Free (público)
 * - Plan Plataforma / enquiva-platform (solo superadmin)
 *
 * Elimina Pro/Enterprise u otros planes residuales (suscripciones → Free).
 * Uso: pnpm run db:sync:plans
 */
import { SubscriptionService } from "../src/lib/billing/subscription.service";

async function main() {
  console.log("Syncing canonical plans (Free + Platform special)...");
  await SubscriptionService.ensureDefaultPlans();
  console.log("Done. Only Free and Plan Plataforma remain.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
