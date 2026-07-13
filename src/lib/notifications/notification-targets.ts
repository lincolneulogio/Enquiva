import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getSystemSettings, type SystemSettings } from "@/lib/settings";

/** Flags de alertas de plataforma que pueden condicionar notificaciones a superadmins. */
export type PlatformAlertFlag = keyof Pick<
  SystemSettings,
  | "alertNewPayments"
  | "alertNewRegistrations"
  | "alertTransportCapacity"
  | "alertOrganizerRequests"
  | "alertEventPublished"
  | "alertSubscriptionPastDue"
  | "alertDailyFinanceSummary"
>;

/** Super admins de plataforma (opcionalmente filtrados por un toggle de alertas). */
export async function getSuperAdminUserIds(options?: {
  requireAlert?: PlatformAlertFlag;
  /** @deprecated usa requireAlert: "alertNewPayments" */
  requirePaymentAlerts?: boolean;
}) {
  const flag: PlatformAlertFlag | undefined = options?.requireAlert
    ? options.requireAlert
    : options?.requirePaymentAlerts
      ? "alertNewPayments"
      : undefined;

  if (flag) {
    const settings = await getSystemSettings();
    if (!settings[flag]) return [];
  }

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "super_admin"));

  return rows.map((row) => row.id);
}

/**
 * Staff de entidad (organizador + admins de org).
 * Los superadmins solo se incluyen si `includeSuperAdmins` es true (default)
 * o si pasas `superAdminAlert` y el toggle está activo.
 */
export async function getEntityStaffUserIds(input: {
  organizationId: string | null | undefined;
  organizerId: string | null | undefined;
  excludeUserId?: string;
  /** Incluir todos los superadmins sin mirar toggles. Default true (compat). */
  includeSuperAdmins?: boolean;
  /** Si se indica, solo añade superadmins cuando ese toggle está ON. */
  superAdminAlert?: PlatformAlertFlag;
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

  const includeAllSuperAdmins = input.includeSuperAdmins !== false && !input.superAdminAlert;
  const superAdmins = includeAllSuperAdmins
    ? await getSuperAdminUserIds()
    : input.superAdminAlert
      ? await getSuperAdminUserIds({ requireAlert: input.superAdminAlert })
      : [];

  for (const id of superAdmins) {
    if (id !== input.excludeUserId) recipientIds.add(id);
  }

  return [...recipientIds];
}
