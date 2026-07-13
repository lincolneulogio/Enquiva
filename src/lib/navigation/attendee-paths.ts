import { normalizeRole } from "@/lib/auth/rbac";
import { getDashboardHomeForRole } from "@/lib/navigation/dashboard-paths";

/** Checkout de asistente (cualquier rol autenticado). */
export function paymentCheckoutPath(registrationId: string) {
  return `/checkout/${registrationId}`;
}

/**
 * Destinos post-pago / post-registro.
 * Staff (superadmin/admin/organizer) actúa como asistente fuera del panel /member.
 */
export function getAttendeeDestination(
  role: string | null | undefined,
  kind: "tickets" | "payments" | "transport" | "events",
  options?: { eventSlug?: string },
): string {
  const normalized = normalizeRole(role);
  if (normalized === "member") {
    switch (kind) {
      case "tickets":
        return "/member/tickets";
      case "payments":
        return "/member/payments";
      case "transport":
        return "/member/transport";
      case "events":
        return "/member/events";
    }
  }

  if (options?.eventSlug) {
    return `/events/${options.eventSlug}`;
  }

  return getDashboardHomeForRole(normalized);
}
