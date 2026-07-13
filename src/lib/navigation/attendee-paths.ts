import { normalizeRole } from "@/lib/auth/rbac";
import { getDashboardHomeForRole } from "@/lib/navigation/dashboard-paths";

/** Checkout de asistente (cualquier rol autenticado). */
export function paymentCheckoutPath(registrationId: string) {
  return `/checkout/${registrationId}`;
}

/**
 * Destinos post-pago / post-registro.
 * Staff actúa como asistente en /attendee/* (fuera del panel /member).
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

  switch (kind) {
    case "tickets":
      return "/attendee/tickets";
    case "payments":
      return "/attendee/payments";
    case "transport":
      return options?.eventSlug ? `/events/${options.eventSlug}` : "/attendee/tickets";
    case "events":
      return options?.eventSlug ? `/events/${options.eventSlug}` : "/events";
  }

  return getDashboardHomeForRole(normalized);
}
