/**
 * Seed único permitido tras un reset: los 4 roles de plataforma.
 * No crea planes, categorías, usuarios ni datos de demo.
 */
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { DEFAULT_ROLES } from "@/lib/auth/default-roles";

async function seedRolesOnly() {
  console.log("Seeding platform roles only (no plans, categories, or demo data)...");

  for (const role of DEFAULT_ROLES) {
    await db.insert(roles).values(role).onConflictDoNothing();
    console.log(`  ✓ ${role.name}`);
  }

  console.log("Done. Roles ready. Create plans/users from the app.");
  process.exit(0);
}

seedRolesOnly().catch((err) => {
  console.error("Failed to seed roles:", err);
  process.exit(1);
});
