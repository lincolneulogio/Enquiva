import { normalizeRole } from "@/lib/auth/rbac";
import { getPublicDashboardPath } from "@/lib/navigation/public-header-nav";
import { getAttendeeDestination } from "@/lib/navigation/attendee-paths";
import { canSeePlansNav } from "@/lib/navigation/pricing-cta";

export type LandingAudience =
  | "guest"
  | "member"
  | "organizer"
  | "admin"
  | "super_admin"
  | "scanner";

export type LandingCta = {
  href: string;
  label: string;
  variant: "primary" | "secondary";
};

export type LandingCopy = {
  audience: LandingAudience;
  heroTitleStart: string;
  heroTitleHighlight: string;
  heroDescription: string;
  primaryCta: LandingCta;
  secondaryCta: LandingCta | null;
  showPlans: boolean;
  aboutTitleStart: string;
  aboutTitleHighlight: string;
  aboutDescription: string;
  aboutButtonLabel: string;
  aboutButtonHref: string;
  footerExploreLinks: Array<{ href: string; label: string }>;
  footerAccountLinks: Array<{ href: string; label: string }>;
  footerContactCta: LandingCta;
};

type BuildArgs = {
  role?: string | null;
  locale: "es" | "en";
  t: (key: string) => string;
};

function audienceFromRole(role?: string | null): LandingAudience {
  if (!role) return "guest";
  const n = normalizeRole(role);
  if (n === "super_admin") return "super_admin";
  if (n === "admin") return "admin";
  if (n === "organizer") return "organizer";
  if (n === "scanner") return "scanner";
  return "member";
}

/**
 * Copy y CTAs de la landing según rol (incluido visitante/invitado).
 */
export function getLandingCopy({ role, locale, t }: BuildArgs): LandingCopy {
  const audience = audienceFromRole(role);
  const isEn = locale === "en";
  const dashboard = getPublicDashboardPath(role);
  const showPlans = canSeePlansNav(role);

  switch (audience) {
    case "super_admin":
      return {
        audience,
        heroTitleStart: isEn ? "Operate the platform" : "Opera la plataforma",
        heroTitleHighlight: isEn ? "with clarity" : "con claridad",
        heroDescription: isEn
          ? "Review plans, events, billing and global metrics from your control panel."
          : "Revisa planes, eventos, facturación y métricas globales desde tu panel de control.",
        primaryCta: {
          href: dashboard,
          label: isEn ? "Open platform panel" : "Abrir panel plataforma",
          variant: "primary",
        },
        secondaryCta: {
          href: "/superadmin/plans",
          label: isEn ? "SaaS plans" : "Planes SaaS",
          variant: "secondary",
        },
        showPlans: true,
        aboutTitleStart: isEn ? "Your workspace to" : "Tu espacio para",
        aboutTitleHighlight: isEn ? "govern Enquiva" : "gobernar Enquiva",
        aboutDescription: isEn
          ? "As platform owner you configure SaaS plans, permissions and the experience for every organization."
          : "Como dueño de la plataforma configures planes SaaS, permisos y la experiencia de cada organización.",
        aboutButtonLabel: isEn ? "Go to panel" : "Ir al panel",
        aboutButtonHref: dashboard,
        footerExploreLinks: [
          { href: "/events", label: t("common.browseEvents") },
          { href: "/superadmin/events", label: isEn ? "Platform events" : "Eventos plataforma" },
          { href: "/pricing", label: isEn ? "Public pricing" : "Precios públicos" },
        ],
        footerAccountLinks: [
          { href: dashboard, label: isEn ? "Platform panel" : "Panel plataforma" },
          { href: "/superadmin/plans", label: isEn ? "SaaS plans" : "Planes SaaS" },
          { href: "/superadmin/billing", label: isEn ? "Billing" : "Facturación" },
        ],
        footerContactCta: {
          href: dashboard,
          label: isEn ? "Open panel" : "Abrir panel",
          variant: "primary",
        },
      };

    case "admin":
      return {
        audience,
        heroTitleStart: isEn ? "Lead your organization" : "Dirige tu organización",
        heroTitleHighlight: isEn ? "with Enquiva" : "con Enquiva",
        heroDescription: isEn
          ? "Manage your team, events and entity plan from one place."
          : "Gestiona tu equipo, eventos y el plan de tu entidad desde un solo lugar.",
        primaryCta: {
          href: dashboard,
          label: isEn ? "Open admin panel" : "Abrir panel admin",
          variant: "primary",
        },
        secondaryCta: {
          href: "/admin/plan",
          label: isEn ? "Entity plan" : "Plan de la entidad",
          variant: "secondary",
        },
        showPlans: true,
        aboutTitleStart: isEn ? "Built for" : "Hecho para",
        aboutTitleHighlight: isEn ? "entity leaders" : "líderes de entidad",
        aboutDescription: isEn
          ? "Approve organizers, follow registrations and keep your entity within plan limits."
          : "Aprueba organizadores, sigue inscripciones y mantén tu entidad dentro de los límites del plan.",
        aboutButtonLabel: isEn ? "Go to panel" : "Ir al panel",
        aboutButtonHref: dashboard,
        footerExploreLinks: [
          { href: "/events", label: t("common.browseEvents") },
          { href: "/admin/events", label: isEn ? "Entity events" : "Eventos de la entidad" },
          { href: "/pricing", label: isEn ? "Plans" : "Planes" },
        ],
        footerAccountLinks: [
          { href: dashboard, label: isEn ? "Admin panel" : "Panel admin" },
          { href: "/admin/plan", label: isEn ? "Entity plan" : "Plan entidad" },
          { href: "/admin/team", label: isEn ? "Team" : "Equipo" },
        ],
        footerContactCta: {
          href: dashboard,
          label: isEn ? "Open panel" : "Abrir panel",
          variant: "primary",
        },
      };

    case "organizer":
      return {
        audience,
        heroTitleStart: isEn ? "Your next event" : "Tu próximo evento",
        heroTitleHighlight: isEn ? "starts here" : "empieza aquí",
        heroDescription: isEn
          ? "Publish events, track attendees, payments and check-in from your organizer workspace."
          : "Publica eventos, sigue asistentes, pagos y check-in desde tu espacio de organizador.",
        primaryCta: {
          href: "/organizer/events",
          label: isEn ? "My events" : "Mis eventos",
          variant: "primary",
        },
        secondaryCta: {
          href: "/organizer/billing",
          label: isEn ? "Billing & plan" : "Facturación y plan",
          variant: "secondary",
        },
        showPlans: true,
        aboutTitleStart: isEn ? "Everything you need to" : "Todo lo que necesitas para",
        aboutTitleHighlight: isEn ? "run events" : "hacer eventos",
        aboutDescription: isEn
          ? "From registrations to QR check-in and transport, Enquiva keeps your event operations organized."
          : "Desde inscripciones hasta check-in QR y transporte, Enquiva mantiene tu operación ordenada.",
        aboutButtonLabel: isEn ? "Organizer panel" : "Panel organizador",
        aboutButtonHref: dashboard,
        footerExploreLinks: [
          { href: "/events", label: t("common.browseEvents") },
          { href: "/organizer/events", label: isEn ? "My events" : "Mis eventos" },
          { href: "/pricing", label: isEn ? "Plans" : "Planes" },
        ],
        footerAccountLinks: [
          { href: dashboard, label: isEn ? "Organizer panel" : "Panel organizador" },
          { href: "/organizer/billing", label: isEn ? "Billing" : "Facturación" },
          { href: "/organizer/scan", label: "Check-in" },
        ],
        footerContactCta: {
          href: dashboard,
          label: isEn ? "Open panel" : "Abrir panel",
          variant: "primary",
        },
      };

    case "scanner":
      return {
        audience,
        heroTitleStart: isEn ? "Ready for" : "Listo para",
        heroTitleHighlight: isEn ? "check-in" : "el check-in",
        heroDescription: isEn
          ? "Scan QR tickets and confirm attendance. Your role is focused on the door experience."
          : "Escanea tickets QR y confirma asistencia. Tu rol está enfocado en el ingreso al evento.",
        primaryCta: {
          href: "/scanner/scan",
          label: isEn ? "Open scanner" : "Abrir scanner",
          variant: "primary",
        },
        secondaryCta: null,
        showPlans: false,
        aboutTitleStart: isEn ? "Staff access for" : "Acceso de staff para",
        aboutTitleHighlight: isEn ? "smooth entry" : "un ingreso ágil",
        aboutDescription: isEn
          ? "You only need the scanner tools. Ask an admin if you need access to more modules."
          : "Solo necesitas las herramientas de escaneo. Pide a un admin si necesitas más módulos.",
        aboutButtonLabel: isEn ? "Go to scanner" : "Ir al scanner",
        aboutButtonHref: "/scanner/scan",
        footerExploreLinks: [
          { href: "/scanner/scan", label: isEn ? "Check-in" : "Check-in" },
        ],
        footerAccountLinks: [
          { href: "/scanner", label: isEn ? "Scanner panel" : "Panel scanner" },
        ],
        footerContactCta: {
          href: "/scanner/scan",
          label: isEn ? "Start scanning" : "Empezar a escanear",
          variant: "primary",
        },
      };

    case "member":
      return {
        audience,
        heroTitleStart: isEn ? "Discover events" : "Descubre eventos",
        heroTitleHighlight: isEn ? "for you" : "para ti",
        heroDescription: isEn
          ? "Browse public events, register in seconds and keep your tickets in one place."
          : "Explora eventos públicos, inscríbete en segundos y guarda tus entradas en un solo lugar.",
        primaryCta: {
          href: "/events",
          label: t("public.home.browseEvents"),
          variant: "primary",
        },
        secondaryCta: {
          href: getAttendeeDestination(role, "tickets"),
          label: t("dashboard.member.ticketsTitle"),
          variant: "secondary",
        },
        showPlans: false,
        aboutTitleStart: isEn ? "Your ticket to" : "Tu acceso a",
        aboutTitleHighlight: isEn ? "great experiences" : "grandes experiencias",
        aboutDescription: isEn
          ? "As an attendee you can join events, pay securely and show your QR ticket at the door."
          : "Como asistente puedes unirte a eventos, pagar con seguridad y mostrar tu ticket QR en la puerta.",
        aboutButtonLabel: isEn ? "My tickets" : "Mis entradas",
        aboutButtonHref: getAttendeeDestination(role, "tickets"),
        footerExploreLinks: [
          { href: "/events", label: t("common.browseEvents") },
          {
            href: getAttendeeDestination(role, "events"),
            label: isEn ? "My events" : "Mis eventos",
          },
        ],
        footerAccountLinks: [
          { href: dashboard, label: isEn ? "My panel" : "Mi panel" },
          {
            href: getAttendeeDestination(role, "tickets"),
            label: t("dashboard.member.ticketsTitle"),
          },
          {
            href: getAttendeeDestination(role, "payments"),
            label: isEn ? "My payments" : "Mis pagos",
          },
        ],
        footerContactCta: {
          href: "/events",
          label: t("common.browseEvents"),
          variant: "primary",
        },
      };

    case "guest":
    default:
      return {
        audience: "guest",
        heroTitleStart: t("public.home.heroTitleStart"),
        heroTitleHighlight: t("public.home.heroTitleHighlight"),
        heroDescription: isEn
          ? "Browse as a guest: discover conferences, workshops and festivals. Create an account when you are ready to register or organize."
          : "Explora como invitado: descubre conferencias, talleres y festivales. Crea una cuenta cuando quieras inscribirte u organizar.",
        primaryCta: {
          href: "/events",
          label: t("public.home.browseEvents"),
          variant: "primary",
        },
        secondaryCta: {
          href: "/register",
          label: isEn ? "Create free account" : "Crear cuenta gratis",
          variant: "secondary",
        },
        showPlans: true,
        aboutTitleStart: t("public.home.aboutTitleStart"),
        aboutTitleHighlight: t("public.home.aboutTitleHighlight"),
        aboutDescription: isEn
          ? "No account needed to explore. Sign up in minutes to register for events or launch your own with Enquiva."
          : "No necesitas cuenta para explorar. Regístrate en minutos para inscribirte a eventos o lanzar los tuyos con Enquiva.",
        aboutButtonLabel: t("public.home.aboutButton"),
        aboutButtonHref: "/register",
        footerExploreLinks: [
          { href: "/events", label: t("common.browseEvents") },
          { href: "/pricing", label: isEn ? "Plans" : "Planes" },
          { href: "/register", label: t("public.home.createAccount") },
        ],
        footerAccountLinks: [
          { href: "/login", label: t("common.signIn") },
          { href: "/register", label: t("common.getStarted") },
          {
            href: "/pricing",
            label: isEn ? "Organize with Enquiva" : "Organiza con Enquiva",
          },
        ],
        footerContactCta: {
          href: "/register",
          label: t("public.home.ctaButton"),
          variant: "primary",
        },
      };
  }
}
