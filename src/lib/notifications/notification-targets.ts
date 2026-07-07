import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { getSystemSettings } from "@/lib/settings";

/** Super admins de plataforma (opcionalmente solo si alertas de pagos están activas). */
export async function getSuperAdminUserIds(options?: { requirePaymentAlerts?: boolean }) {
  if (options?.requirePaymentAlerts) {
    const settings = await getSystemSettings();
    if (!settings.alertNewPayments) return [];
  }

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "super_admin"));

  return rows.map((row) => row.id);
}

/** Administrador de entidad y super admins con alcance sobre la organización. */
export async function getEntityStaffUserIds(input: {
  organizationId: string | null | undefined;
  organizerId: string | null | undefined;
  excludeUserId?: string;
}) {
  const recipientIds = new Set<string>();

  if (input.organizerId && input.organizerId !== input.excludeUserId) {
    recipientIds.add(input.organizerId);
  }

  if (input.organizationId) {
    const orgAdmins = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "admin"), eq(users.organizationId, input.organizationId)));

    for (const admin of orgAdmins) {
      if (admin.id !== input.excludeUserId) recipientIds.add(admin.id);
    }
  }

  const superAdmins = await getSuperAdminUserIds();
  for (const id of superAdmins) {
    if (id !== input.excludeUserId) recipientIds.add(id);
  }

  return [...recipientIds];
}
