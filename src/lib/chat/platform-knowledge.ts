/**
 * Fuente única de verdad + chunks recuperables para el Copilot (RAG liviano).
 */

export type PlatformModule = {
  id: number;
  name: string;
  summary: string;
  details?: string;
  /** Sinónimos / frases que el usuario suele usar al preguntar por este módulo */
  synonyms: string[];
  /** Preguntas frecuentes / cómo funciona (para retrieval) */
  faqs: string[];
};

export const PLATFORM_MODULE_COUNT = 11;

export const PLATFORM_MODULES: PlatformModule[] = [
  {
    id: 1,
    name: "Público y marketing",
    summary:
      "Landing, catálogo de eventos, detalle por slug, checkout de pago y área de asistente para staff que actúa como participante.",
    details:
      "Rutas: / , /events , /events/[slug] , /checkout/[registrationId] , /attendee/tickets y /attendee/payments.",
    synonyms: [
      "landing",
      "home",
      "inicio",
      "catalogo",
      "catálogo",
      "publico",
      "público",
      "marketing",
      "checkout",
      "pagina publica",
      "slug",
    ],
    faqs: [
      "La portada muestra eventos destacados y próximos. El catálogo está en /events con filtros y búsqueda.",
      "El detalle de un evento está en /events/[slug] e incluye el botón de inscripción.",
      "El pago del asistente se hace en /checkout/[registrationId] tras registrarse.",
      "Un admin u organizador puede comprar como asistente y ver tickets en /attendee/tickets.",
    ],
  },
  {
    id: 2,
    name: "Autenticación y cuentas",
    summary:
      "Login, registro, verificación, recuperación de contraseña, roles (superadministrador, admin, organizador, miembro), perfil y permisos.",
    details: "Roles técnicos: super_admin, admin, organizer, member.",
    synonyms: [
      "login",
      "registro",
      "auth",
      "autenticacion",
      "autenticación",
      "cuenta",
      "password",
      "contraseña",
      "otp",
      "rol",
      "roles",
      "permisos",
      "perfil",
      "usuario",
      "miembro",
      "organizador",
      "admin",
      "superadmin",
    ],
    faqs: [
      "Los roles son super_admin, admin, organizer y member. Cada uno ve un panel distinto.",
      "El registro puede incluir verificación de cuenta. La recuperación de contraseña usa el flujo de auth de la plataforma.",
      "El perfil permite actualizar datos personales y avatar según el panel del rol.",
      "Los permisos granulares definen qué puede hacer un admin dentro de su entidad.",
    ],
  },
  {
    id: 3,
    name: "Eventos",
    summary:
      "Crear, editar, publicar y cerrar eventos; categorías, portadas y estados (borrador, publicado, cancelado, completado).",
    details:
      "Estados: draft, published, cancelled, completed. Paneles: /member/events , /organizer/events , /admin/events , /superadmin/events.",
    synonyms: [
      "evento",
      "eventos",
      "conferencia",
      "taller",
      "festival",
      "categoria",
      "categoría",
      "publicar",
      "borrador",
      "portada",
      "capacidad",
      "cronograma",
    ],
    faqs: [
      "Un evento pasa por draft (borrador), published (público), cancelled o completed.",
      "Solo los publicados aparecen en el catálogo público e indican inscripción.",
      "Organizador y admin crean o editan desde su panel de eventos; el superadmin ve el inventario global.",
      "Puede ser presencial (ubicación) o virtual (enlace de reunión), con precio y capacidad opcionales.",
    ],
  },
  {
    id: 4,
    name: "Inscripciones y tickets",
    summary:
      "Registro en eventos, invitados, lista de espera, tickets con QR firmado y validación de asistencia.",
    details:
      "Estados: registered, checked_in, waitlisted, cancelled. Teléfono Perú: +519XXXXXXXX. Rutas: /member/tickets , /attendee/tickets , /organizer/attendees , /admin/registrations.",
    synonyms: [
      "inscripcion",
      "inscripción",
      "inscripciones",
      "ticket",
      "tickets",
      "entrada",
      "entradas",
      "qr",
      "checkin",
      "check-in",
      "asistencia",
      "waitlist",
      "lista de espera",
      "invitado",
      "invitados",
      "registro",
    ],
    faqs: [
      "Al inscribirse se genera un ticket con código QR firmado criptográficamente.",
      "Estados: registered, checked_in, waitlisted y cancelled.",
      "Se pueden agregar invitados ligados al registro titular.",
      "El teléfono de contacto en Perú sigue el formato +519XXXXXXXX.",
      "El miembro ve sus entradas en /member/tickets; el staff como asistente en /attendee/tickets.",
    ],
  },
  {
    id: 5,
    name: "Pagos",
    summary:
      "Cobro Culqi en checkout (tarjeta, Yape y billeteras), efectivo en puerta cuando aplica, y facturación SaaS de planes de la plataforma.",
    details:
      "Culqi organizador = eventos; Culqi plataforma = planes SaaS. Estados: pending, approved, rejected. Rutas: /checkout/[registrationId] , /member/payments , /attendee/payments , /organizer/payments , /admin/payments , /organizer/billing , /admin/plan.",
    synonyms: [
      "pago",
      "pagos",
      "culqi",
      "yape",
      "tarjeta",
      "efectivo",
      "checkout",
      "cobro",
      "facturacion",
      "facturación",
      "comprobante",
      "billing evento",
    ],
    faqs: [
      "El flujo principal de pago del asistente es Culqi en /checkout/[registrationId] (tarjeta, Yape y billeteras).",
      "También puede usarse efectivo en puerta cuando el organizador lo habilita.",
      "Estados de pago: pending, approved y rejected.",
      "Hay dos Culqi distintos: el del organizador para eventos y el de plataforma para planes SaaS.",
    ],
  },
  {
    id: 6,
    name: "Transporte",
    summary:
      "Rutas, paradas, asientos y reservas de buses asociados a un evento.",
    details: "Rutas: /member/transport , /organizer/transport , /admin/transport.",
    synonyms: [
      "transporte",
      "bus",
      "buses",
      "ruta",
      "rutas",
      "parada",
      "paradas",
      "asiento",
      "asientos",
      "pasaje",
      "movilidad",
    ],
    faqs: [
      "Cada evento puede tener rutas de bus con punto de partida, hora, asientos y precio.",
      "El asistente reserva transporte después de estar inscrito, según la configuración del evento.",
      "Organizador y admin gestionan rutas en sus paneles de transporte.",
    ],
  },
  {
    id: 7,
    name: "Organizaciones",
    summary:
      "Entidades, códigos de invitación, onboarding, equipo y alcance de datos por organización.",
    synonyms: [
      "organizacion",
      "organización",
      "entidad",
      "entidades",
      "equipo",
      "invite",
      "invitacion",
      "invitación",
      "onboarding",
      "tenant",
    ],
    faqs: [
      "Una organización (entidad) agrupa admins, organizadores y datos con alcance propio.",
      "Se puede unir o invitar miembros con código de invitación.",
      "El admin de entidad solo ve usuarios, eventos e inscripciones de su organización.",
    ],
  },
  {
    id: 8,
    name: "Planes y billing SaaS",
    summary:
      "Suscripciones, límites del plan (Culqi, transporte, IA, exportaciones) y renovaciones.",
    details: "Rutas: /organizer/billing , /admin/plan , planes en superadmin.",
    synonyms: [
      "plan",
      "planes",
      "suscripcion",
      "suscripción",
      "saas",
      "renovacion",
      "renovación",
      "billing",
      "limites",
      "límites",
      "features",
    ],
    faqs: [
      "Los planes SaaS habilitan o limitan funciones: Culqi, transporte, IA Copilot y exportaciones.",
      "El cobro de suscripción usa Culqi de plataforma en /organizer/billing o /admin/plan.",
      "El superadmin define los planes disponibles en la plataforma.",
    ],
  },
  {
    id: 9,
    name: "Comunicaciones",
    summary:
      "Notificaciones in-app, broadcasts, correo y push web cuando está configurado.",
    details:
      "Staff puede usar previewMassNotification y luego sendMassNotification.",
    synonyms: [
      "notificacion",
      "notificación",
      "notificaciones",
      "broadcast",
      "comunicado",
      "correo",
      "email",
      "push",
      "mensaje masivo",
      "avisos",
    ],
    faqs: [
      "Las notificaciones pueden llegar in-app, por correo y por push web si VAPID está configurado.",
      "Los broadcasts permiten comunicados a grupos de destinatarios.",
      "Desde el Copilot, el staff debe hacer preview de una notificación masiva antes de enviarla.",
    ],
  },
  {
    id: 10,
    name: "Admin y operaciones",
    summary:
      "Paneles por rol, auditoría, analítica, exportaciones y mantenimiento.",
    details:
      "Auditoría: /admin/audit , /superadmin/audit. Escáner: /organizer/scan , /admin/scan.",
    synonyms: [
      "admin",
      "panel",
      "auditoria",
      "auditoría",
      "analytics",
      "analitica",
      "analítica",
      "export",
      "exportacion",
      "exportación",
      "scanner",
      "escaner",
      "escáner",
      "mantenimiento",
      "operaciones",
    ],
    faqs: [
      "Cada rol tiene su dashboard: superadmin, admin, organizer y member.",
      "La auditoría registra acciones relevantes del sistema.",
      "El escáner de QR en /organizer/scan o /admin/scan valida tickets en puerta.",
      "Las exportaciones permiten descargar datos operativos según permisos y plan.",
    ],
  },
  {
    id: 11,
    name: "IA y extras",
    summary:
      "EvoraBot (copilot), idiomas ES/EN, almacenamiento de archivos, Redis, Docker, CI y tareas programadas.",
    synonyms: [
      "ia",
      "ai",
      "copilot",
      "evorabot",
      "bot",
      "asistente",
      "i18n",
      "idioma",
      "redis",
      "docker",
      "cron",
      "upload",
    ],
    faqs: [
      "EvoraBot responde con conocimiento de módulos y consulta datos reales mediante herramientas.",
      "La plataforma soporta español e inglés.",
      "Hay almacenamiento de archivos, Redis para rate limits/caché, Docker y crons de mantenimiento.",
    ],
  },
];

export const PLATFORM_OVERVIEW =
  "Evora cubre el ciclo completo de un evento: publicación, inscripción, pago, transporte, acceso en puerta y operación del negocio.";

export function buildPlatformKnowledgePayload(topic?: string) {
  const retrieved = topic?.trim()
    ? scoreModules(topic).slice(0, 4).map((r) => r.module)
    : PLATFORM_MODULES;

  const modules = retrieved.length > 0 ? retrieved : PLATFORM_MODULES;

  return {
    source: "platform_knowledge" as const,
    asOf: new Date().toISOString(),
    moduleCount: PLATFORM_MODULE_COUNT,
    overview: PLATFORM_OVERVIEW,
    modules: modules.map((m) => ({
      number: m.id,
      name: m.name,
      whatItDoes: m.summary,
      ...(m.details ? { extra: m.details } : {}),
      howItWorks: m.faqs,
    })),
    grounding:
      "Hay exactamente 11 módulos. Usa SOLO esta información. No inventes módulos ni cifras. Si la pregunta es sobre conteos de la BD, usa getEventStats u otra tool de datos.",
  };
}

export function formatPlatformKnowledgeForPrompt(): string {
  const lines = PLATFORM_MODULES.map(
    (m) =>
      `${m.id}. ${m.name}\n${m.summary}${m.details ? `\n${m.details}` : ""}`,
  );
  return [
    `La plataforma Evora tiene ${PLATFORM_MODULE_COUNT} módulos principales.`,
    PLATFORM_OVERVIEW,
    ...lines,
  ].join("\n\n");
}

function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[¿?¡!.,;:()[\]{}«»"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreModules(query: string): Array<{ module: PlatformModule; score: number }> {
  const q = normalizeQuery(query);
  const tokens = q.split(" ").filter((t) => t.length > 2);

  return PLATFORM_MODULES.map((module) => {
    let score = 0;
    const haystack = normalizeQuery(
      [module.name, module.summary, module.details ?? "", ...module.synonyms, ...module.faqs].join(
        " ",
      ),
    );

    for (const syn of module.synonyms) {
      const s = normalizeQuery(syn);
      if (q.includes(s) || s.includes(q)) score += 8;
      if (tokens.some((t) => s.includes(t) || t.includes(s))) score += 3;
    }

    if (haystack.includes(q)) score += 6;
    for (const t of tokens) {
      if (haystack.includes(t)) score += 2;
    }

    // Menciona el nombre del módulo
    if (q.includes(normalizeQuery(module.name))) score += 12;

    return { module, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

export { scoreModules, normalizeQuery };
