/**
 * Bootstrap mínimo de plataforma tras reset o primer arranque:
 * - roles de plataforma
 * - plan Free (público)
 * - plan Plataforma (solo superadmin)
 *
 * Otros planes SaaS: el superadmin los crea en el panel cuando quiera.
 */
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { DEFAULT_ROLES } from "@/lib/auth/default-roles";
import { SubscriptionService } from "@/lib/billing/subscription.service";

async function seedBootstrap() {
  console.log("Bootstrapping platform (roles + Free + Plan Plataforma)...");

  for (const role of DEFAULT_ROLES) {
    await db.insert(roles).values(role).onConflictDoNothing();
    console.log(`  ✓ role ${role.name}`);
  }

  await SubscriptionService.ensureDefaultPlans();
  console.log("  ✓ plans: Free + Plan Plataforma");

  console.log("Done. Create users from the app. Extra SaaS plans: superadmin panel.");
  process.exit(0);
}

seedBootstrap().catch((err) => {
  console.error("Failed to bootstrap:", err);
  process.exit(1);
});
