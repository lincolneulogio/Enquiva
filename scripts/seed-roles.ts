import { db } from "@/lib/db";
import { roles, rolePermissions } from "@/lib/db/schema";
import { PERMISSIONS_BY_ROLE, ROLE_LABELS, type AppRole } from "@/lib/rbac";

const roleColors: Record<AppRole, string> = {
  super_admin: "cyan",
  admin: "rose",
  organizer: "blue",
  member: "emerald",
};

const roleDescriptions: Record<AppRole, string> = {
  super_admin: "Acceso total al sistema. Gestiona usuarios, roles y toda la configuración.",
  admin: "Administra eventos globalmente, usuarios y pagos.",
  organizer: "Crea y gestiona sus propios eventos, asistentes y pagos.",
  member: "Usuario básico. Puede registrarse en eventos y ver su perfil.",
};

async function main() {
  console.log("Seeding roles...");

  for (const [roleName, perms] of Object.entries(PERMISSIONS_BY_ROLE)) {
    const name = roleName as AppRole;

    await db.insert(roles)
      .values({
        name,
        label: ROLE_LABELS[name],
        description: roleDescriptions[name],
        color: roleColors[name],
      })
      .onConflictDoNothing();

    for (const permission of perms) {
      await db.insert(rolePermissions)
        .values({ roleName: name, permission, allowed: true })
        .onConflictDoNothing();
    }

    console.log(`  ${ROLE_LABELS[name]}: ${perms.length} permissions`);
  }

  console.log("Roles and permissions seeded successfully");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
