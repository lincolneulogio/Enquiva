import type { AppRole } from "@/lib/auth/rbac";

export type RoleScopeProfile = {
  roleKey: AppRole;
  labelEs: string;
  labelEn: string;
  dataScopeEs: string;
  allowedTopicsEs: string[];
  forbiddenTopicsEs: string[];
  allowedToolsHint: string[];
  refuseTemplateEs: string;
};

const PROFILES: Record<AppRole, RoleScopeProfile> = {
  super_admin: {
    roleKey: "super_admin",
    labelEs: "Superadministrador",
    labelEn: "Super administrator",
    dataScopeEs: "toda la plataforma Evora (global)",
    allowedTopicsEs: [
      "métricas globales de la plataforma",
      "usuarios y roles a nivel plataforma",
      "auditoría de seguridad",
      "planes SaaS, billing de plataforma y configuración",
      "eventos/inscripciones/pagos con visión global",
      "módulos de Evora desde la operación de plataforma",
      "check-in, transporte y broadcasts a escala plataforma",
    ],
    forbiddenTopicsEs: [
      "vista personal de tickets de un miembro concreto como si fueras él (salvo consulta de soporte con tools)",
      "capacidades o menús exclusivos del Admin de organización, Organizador o Miembro como guía de uso de ese rol",
      "instrucciones de 'cómo actuar como organizador/miembro' para suplantar otro rol",
    ],
    allowedToolsHint: [
      "getEventStats",
      "getUsersList",
      "getAuditLogs",
      "getRegistrationsList",
      "getPaymentStatus",
      "getCheckInStats",
      "getTransportSeats",
      "getMyPlanBilling",
      "getMyNextEvent",
      "draftBroadcast",
      "previewMassNotification",
      "sendMassNotification",
      "searchEvents",
      "getPlatformKnowledge",
      "getEventRoutes",
    ],
    refuseTemplateEs:
      "Esa consulta corresponde a otro rol (Admin de entidad, Organizador o Miembro). Como Superadministrador solo te ayudo con la operación global de la plataforma. Reformula desde el alcance de plataforma o cambia de cuenta al rol adecuado.",
  },
  admin: {
    roleKey: "admin",
    labelEs: "Administrador",
    labelEn: "Administrator",
    dataScopeEs: "tu organización / entidad",
    allowedTopicsEs: [
      "métricas de tu organización",
      "usuarios e inscritos de tu entidad",
      "eventos, pagos, check-in y transporte de tu alcance",
      "comunicaciones y borradores de avisos de tu entidad",
      "plan/límites de tu organización",
    ],
    forbiddenTopicsEs: [
      "métricas o usuarios globales de toda la plataforma (reservados al Superadministrador)",
      "instrucciones como si fueras Organizador de eventos ajenos a tu entidad",
      "guía de tickets personales de Miembro",
    ],
    allowedToolsHint: [
      "getEventStats",
      "getUsersList",
      "getRegistrationsList",
      "getPaymentStatus",
      "getCheckInStats",
      "getTransportSeats",
      "getAuditLogs",
      "getMyPlanBilling",
      "draftBroadcast",
      "previewMassNotification",
      "sendMassNotification",
      "searchEvents",
      "getPlatformKnowledge",
      "getEventRoutes",
      "getMyNextEvent",
    ],
    refuseTemplateEs:
      "Eso está fuera del alcance de Administrador de entidad. No puedo darte la perspectiva de Superadministrador, Organizador ajeno o Miembro. Pregunta solo sobre tu organización.",
  },
  organizer: {
    roleKey: "organizer",
    labelEs: "Organizador",
    labelEn: "Organizer",
    dataScopeEs: "tus eventos (como organizador)",
    allowedTopicsEs: [
      "estadísticas de tus eventos",
      "inscritos, pagos y check-in de tus eventos",
      "transporte y asientos de tus eventos",
      "borradores y envíos de comunicados de tus eventos",
      "checkout/Culqi aplicado a tus eventos",
      "tu plan y límites",
    ],
    forbiddenTopicsEs: [
      "datos globales de toda la plataforma",
      "gestión de usuarios de toda una organización ajena (Admin)",
      "auditoría de seguridad de plataforma",
      "tickets personales de otro miembro",
    ],
    allowedToolsHint: [
      "getEventStats",
      "getRegistrationsList",
      "getPaymentStatus",
      "getCheckInStats",
      "getTransportSeats",
      "getMyPlanBilling",
      "draftBroadcast",
      "previewMassNotification",
      "sendMassNotification",
      "searchEvents",
      "getPlatformKnowledge",
      "getEventRoutes",
      "getMyNextEvent",
    ],
    refuseTemplateEs:
      "Esa información corresponde a otro rol (Superadmin, Admin de entidad o Miembro). Como Organizador solo te ayudo con tus eventos y su operación.",
  },
  member: {
    roleKey: "member",
    labelEs: "Miembro",
    labelEn: "Member",
    dataScopeEs: "tu cuenta personal (inscripciones, tickets y pagos propios)",
    allowedTopicsEs: [
      "tus tickets e inscripciones",
      "tu próximo evento",
      "estado de tus pagos",
      "buscar eventos públicos para inscribirte",
      "cómo usar checkout y tu plan personal si aplica",
      "explicación general de funciones de Evora para asistentes",
    ],
    forbiddenTopicsEs: [
      "métricas internas de organizadores o de la plataforma",
      "listados de usuarios, auditoría, broadcasts masivos",
      "asientos/disponibilidad operativa de staff",
      "paneles /superadmin, /admin u /organizer",
    ],
    allowedToolsHint: [
      "getMyTickets",
      "getMyNextEvent",
      "getPaymentStatus",
      "getMyPlanBilling",
      "searchEvents",
      "getPlatformKnowledge",
    ],
    refuseTemplateEs:
      "Eso solo lo puede ver el staff (Organizador, Admin o Superadmin). Como Miembro te ayudo con tus entradas, pagos y eventos en los que participas.",
  },
  scanner: {
    roleKey: "scanner",
    labelEs: "Scanner",
    labelEn: "Scanner",
    dataScopeEs: "check-in de asistentes de tu entidad",
    allowedTopicsEs: [
      "cómo escanear tickets QR",
      "errores comunes de check-in",
      "flujo de ingreso el día del evento",
    ],
    forbiddenTopicsEs: [
      "métricas de billing o planes",
      "gestión de usuarios o permisos",
      "pagos y reembolsos",
      "broadcasts o configuración de organización",
    ],
    allowedToolsHint: ["getCheckInStats", "getPlatformKnowledge"],
    refuseTemplateEs:
      "Como Scanner solo te ayudo con el check-in. Para pagos, eventos o administración cambia a la cuenta con el rol adecuado.",
  },
};

export function getRoleScopeProfile(role: string): RoleScopeProfile {
  if (
    role === "super_admin" ||
    role === "admin" ||
    role === "organizer" ||
    role === "member" ||
    role === "scanner"
  ) {
    return PROFILES[role];
  }
  return PROFILES.member;
}

export function buildRoleIsolationBlock(role: string): string {
  const p = getRoleScopeProfile(role);
  return `AISLAMIENTO ESTRICTO DE ROL (OBLIGATORIO):
Rol activo: ${p.labelEs} (${p.roleKey}).
Alcance de datos: ${p.dataScopeEs}.

PUEDES hablar de:
${p.allowedTopicsEs.map((t) => `- ${t}`).join("\n")}

NO PUEDES:
- Explicar menús, permisos, paneles o flujos pensados para OTRO rol.
- Responder "como si fueras" Admin / Organizador / Miembro / Superadmin distinto al actual.
- Listar capacidades de otros roles aunque te lo pidan ("¿qué puede hacer un organizador?").
- Filtrar datos fuera de tu alcance: las tools ya están limitadas; no inventes lo que no devuelven.

Si la pregunta es de otro rol, responde EXACTAMENTE con este espíritu (adapta breve):
"${p.refuseTemplateEs}"

Tools permitidas en tu sesión (solo estas existen para ti): ${p.allowedToolsHint.join(", ")}.
Nunca menciones tools que no estén en esa lista.`;
}

export function getWelcomeCapabilityKey(role: string): string {
  switch (role) {
    case "super_admin":
      return "copilot.capabilitiesSuperAdmin";
    case "admin":
      return "copilot.capabilitiesAdmin";
    case "organizer":
      return "copilot.capabilitiesOrganizer";
    default:
      return "copilot.capabilitiesMember";
  }
}

export function getInputPlaceholder(role: string, loading: boolean): string {
  if (loading) return "Consultando…";
  switch (role) {
    case "super_admin":
      return "Pregunta por métricas, auditoría, usuarios…";
    case "admin":
      return "Pregunta por tu entidad, eventos, inscritos…";
    case "organizer":
      return "Pregunta por tus eventos, pagos, check-in…";
    default:
      return "Pregunta por tus tickets, eventos, pagos…";
  }
}
