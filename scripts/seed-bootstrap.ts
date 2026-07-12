/**
 * Bootstrap mínimo de plataforma tras reset o primer arranque:
 * - 4 roles de plataforma
 * - plan free (Gratis) — obligatorio para suscripciones
 *
 * Pro/Enterprise: superadmin en el panel o `pnpm db:sync:plans` en deploy.
 */
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { DEFAULT_ROLES } from "@/lib/auth/default-roles";
import { SubscriptionService } from "@/lib/billing/subscription.service";

async function seedBootstrap() {
  console.log("Bootstrapping platform (roles + plan free)...");

  for (const role of DEFAULT_ROLES) {
    await db.insert(roles).values(role).onConflictDoNothing();
    console.log(`  ✓ role ${role.name}`);
  }

  await SubscriptionService.syncFreePlanDefinition();
  console.log("  ✓ plan free (Gratis)");

  console.log("Done. Create users from the app. Pro/Enterprise: superadmin or pnpm db:sync:plans.");
  process.exit(0);
}

seedBootstrap().catch((err) => {
  console.error("Failed to bootstrap:", err);
  process.exit(1);
});
