import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";

/** Cuántos super_admin existen en la plataforma (debe ser 0 o 1). */
export async function countSuperAdmins() {
  const [{ count: total }] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.role, "super_admin"));
  return total;
}

export async function hasSuperAdmin() {
  return (await countSuperAdmins()) > 0;
}

/** Registro público: nunca asigna super_admin (solo vía /superadmin/register). */
export async function resolveSignupRole(): Promise<"member"> {
  return "member";
}

function getBootstrapSecretFromEnv(): string | undefined {
  const raw = process.env.PLATFORM_BOOTSTRAP_SECRET?.trim();
  return raw || undefined;
}

/** En producción siempre se exige clave; en local solo si PLATFORM_BOOTSTRAP_SECRET está definida. */
export function isBootstrapSecretRequired(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  return Boolean(getBootstrapSecretFromEnv());
}

export function validateBootstrapSecret(provided: string) {
  const expected = getBootstrapSecretFromEnv();

  if (process.env.NODE_ENV === "production" && !expected) {
    throw new Error("PLATFORM_BOOTSTRAP_SECRET no está configurado en producción.");
  }

  if (!expected) return;

  if (provided.trim() !== expected) {
    throw new Error("Clave de bootstrap inválida.");
  }
}

export async function getSuperAdminRegisterGate() {
  const canRegister = !(await hasSuperAdmin());
  return {
    canRegister,
    requiresSecret: isBootstrapSecretRequired(),
  };
}

/** Asigna super_admin de forma atómica (solo si aún no existe uno). */
export async function claimPlatformOwner(userId: string) {
  await db.transaction(async (trx) => {
    const [{ count: superCount }] = await trx
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "super_admin"));

    if (superCount > 0) {
      throw new Error("Ya existe un superadministrador de plataforma.");
    }

    await trx
      .update(users)
      .set({ role: "super_admin", updatedAt: new Date() })
      .where(eq(users.id, userId));
  });
}

/** Impide asignar un segundo super_admin desde el panel. */
export async function assertCanAssignSuperAdmin(targetUserId: string) {
  const superAdminCount = await countSuperAdmins();
  if (superAdminCount === 0) return;

  const [target] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (target?.role !== "super_admin") {
    throw new Error("Solo puede existir un super administrador de plataforma.");
  }
}
