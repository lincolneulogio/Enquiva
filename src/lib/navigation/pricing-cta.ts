import { normalizeRole, type AppRole } from "@/lib/auth/rbac";

export type PricingAudience =
  | "guest"
  | "member"
  | "organizer"
  | "admin"
  | "super_admin"
  | "scanner";

export function getPricingAudience(role?: string | null): PricingAudience {
  if (!role) return "guest";
  const normalized = normalizeRole(role);
  if (normalized === "super_admin") return "super_admin";
  if (normalized === "admin") return "admin";
  if (normalized === "organizer") return "organizer";
  if (normalized === "scanner") return "scanner";
  return "member";
}

/** Nav / landing: planes solo para quien opera o puede contratar (no asistentes). */
export function canSeePlansNav(role?: string | null): boolean {
  const audience = getPricingAudience(role);
  return (
    audience === "guest" ||
    audience === "organizer" ||
    audience === "admin" ||
    audience === "super_admin"
  );
}

export function getPricingCta(
  role: string | null | undefined,
  locale: "es" | "en",
): {
  footerText: string;
  linkHref: string;
  linkLabel: string;
  cardHref: string;
  cardLabel: string;
} {
  const audience = getPricingAudience(role);
  const isEn = locale === "en";

  switch (audience) {
    case "super_admin":
      return {
        footerText: isEn
          ? "You manage the SaaS catalog for the whole platform."
          : "Tú administras el catálogo SaaS de toda la plataforma.",
        linkHref: "/superadmin/plans",
        linkLabel: isEn ? "Manage SaaS plans" : "Gestionar planes SaaS",
        cardHref: "/superadmin/plans",
        cardLabel: isEn ? "Open plans" : "Ver planes SaaS",
      };
    case "admin":
      return {
        footerText: isEn
          ? "Review your organization plan and limits from the entity panel."
          : "Revisa el plan y los límites de tu entidad desde el panel.",
        linkHref: "/admin/plan",
        linkLabel: isEn ? "Entity plan" : "Plan de la entidad",
        cardHref: "/admin/plan",
        cardLabel: isEn ? "View my plan" : "Ver mi plan",
      };
    case "organizer":
      return {
        footerText: isEn
          ? "Upgrade or manage your subscription from Billing anytime."
          : "Mejora o administra tu suscripción cuando quieras desde Facturación.",
        linkHref: "/organizer/billing",
        linkLabel: isEn ? "Go to billing" : "Ir a facturación",
        cardHref: "/organizer/billing",
        cardLabel: isEn ? "Manage plan" : "Gestionar plan",
      };
    case "member":
    case "scanner":
      return {
        footerText: isEn
          ? "These plans are for organizations and event organizers, not attendees."
          : "Estos planes son para organizaciones y organizadores de eventos, no para asistentes.",
        linkHref: "/register",
        linkLabel: isEn ? "Become an organizer" : "Quiero organizar eventos",
        cardHref: "/events",
        cardLabel: isEn ? "Browse events" : "Explorar eventos",
      };
    default:
      return {
        footerText: isEn
          ? "Ready to organize? Create an organizer account and choose your plan."
          : "¿Listo para organizar? Crea una cuenta de organizador y elige tu plan.",
        linkHref: "/register",
        linkLabel: isEn ? "Create organizer account" : "Crear cuenta de organizador",
        cardHref: "/register",
        cardLabel: isEn ? "Get started" : "Empezar",
      };
  }
}

export function isStaffPricingRole(role: AppRole): boolean {
  return role === "super_admin" || role === "admin" || role === "organizer";
}
