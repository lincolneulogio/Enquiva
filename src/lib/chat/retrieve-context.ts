import {
  PLATFORM_MODULE_COUNT,
  PLATFORM_OVERVIEW,
  normalizeQuery,
} from "./platform-knowledge";
import { hybridRetrieveAsync } from "./rag";
import { buildRoleIsolationBlock, getRoleScopeProfile } from "./role-scope";

export type ChatIntent =
  | "modules_overview"
  | "module_detail"
  | "live_stats"
  | "live_users"
  | "live_registrations"
  | "live_events_search"
  | "my_tickets"
  | "audit"
  | "transport"
  | "notifications"
  | "general_platform"
  | "unknown";

export type PageContext = {
  pathname?: string;
  eventId?: string;
  eventSlug?: string;
  eventTitle?: string;
};

export type RetrievedContext = {
  intent: ChatIntent;
  requiredTools: string[];
  contextText: string;
  mustDo: string;
  citations: string[];
  ragMode: "hybrid_docs" | "live_sql" | "hybrid_mixed";
  statusHint: string;
};

function lastUserText(messages: unknown): string {
  if (!Array.isArray(messages) || messages.length === 0) return "";
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i] as {
      role?: string;
      content?: unknown;
      parts?: Array<{ type?: string; text?: string }>;
    };
    if (m?.role !== "user") continue;
    if (typeof m.content === "string" && m.content.trim()) return m.content.trim();
    if (Array.isArray(m.parts)) {
      const text = m.parts
        .filter((p) => p.type === "text" && typeof p.text === "string")
        .map((p) => p.text)
        .join(" ")
        .trim();
      if (text) return text;
    }
    if (Array.isArray(m.content)) {
      const text = (m.content as Array<{ type?: string; text?: string }>)
        .filter((p) => p?.type === "text" && typeof p.text === "string")
        .map((p) => p.text)
        .join(" ")
        .trim();
      if (text) return text;
    }
  }
  return "";
}

function detectIntent(query: string): ChatIntent {
  const q = normalizeQuery(query);

  if (
    /(cuantos|cuantas|total|estadistic|metric|resumen de la plataforma|dashboard)/.test(q) &&
    /(evento|usuario|inscrip|ticket|registro|miembro|organiz)/.test(q)
  ) {
    return "live_stats";
  }
  if (/(cuantos|cuantas|estadistic)/.test(q) && /(hay|tiene|existen|van)/.test(q)) {
    return "live_stats";
  }
  if (/(pago|pagos|estado (del )?pago|culqi|yape)/.test(q) && /(estado|verificar|revisar|buscar)/.test(q)) {
    return "live_registrations";
  }
  if (/(check.?in|ingresaron|asistieron|escane)/.test(q)) {
    return "live_stats";
  }
  if (/(listar|lista|mostrar|ver).*(usuario|users)/.test(q) || /usuarios (de|en|registrados)/.test(q)) {
    return "live_users";
  }
  if (/(listar|lista|mostrar).*(inscrip|registro|asistente)/.test(q)) {
    return "live_registrations";
  }
  if (/(mis tickets|mis entradas|mi ticket|mi inscripción|mi inscripcion|proximo evento|próximo evento)/.test(q)) {
    return "my_tickets";
  }
  if (/(auditor|log de|actividad reciente|seguridad)/.test(q)) {
    return "audit";
  }
  if (/(notific|broadcast|comunicado|aviso masivo|enviar mensaje)/.test(q)) {
    return "notifications";
  }
  if (/(transporte|bus|ruta|paradero|asiento)/.test(q)) {
    return "transport";
  }
  if (
    /(cuantos modulos|cuántos módulos|que modulos|qué módulos|modulos tiene|módulos tiene|inventario de modulos)/.test(
      q,
    )
  ) {
    return "modules_overview";
  }
  if (
    /(que es evora|qué es evora|que hace la (app|plataforma)|cómo funciona evora|para que sirve|de que trata)/.test(
      q,
    )
  ) {
    return "general_platform";
  }
  if (/(buscar|encontrar|hay eventos de|eventos de|proximos eventos|próximos eventos)/.test(q)) {
    return "live_events_search";
  }
  if (/(modulo|módulo|como funciona|cómo funciona|que hace|qué hace|explicame|explícame|para que sirve)/.test(q)) {
    return "module_detail";
  }
  if (/(evora|plataforma|sistema|panel|checkout|culqi|pago|ticket)/.test(q)) {
    return "general_platform";
  }
  return "unknown";
}

function formatPageContext(page?: PageContext | null): string {
  if (!page?.pathname && !page?.eventId && !page?.eventSlug && !page?.eventTitle) {
    return "";
  }
  return [
    "CONTEXTO DE PÁGINA ACTUAL (el usuario está aquí ahora):",
    page.pathname ? `- Ruta: ${page.pathname}` : null,
    page.eventTitle ? `- Evento abierto: ${page.eventTitle}` : null,
    page.eventId ? `- eventId: ${page.eventId}` : null,
    page.eventSlug ? `- slug: ${page.eventSlug}` : null,
    "Si la pregunta usa 'este evento', 'aquí' o 'esto', interpreta esos identificadores.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Agentic + Hybrid RAG (async: rewrite + pgvector + rerank).
 */
export async function retrieveChatContext(
  messages: unknown,
  role: string,
  page?: PageContext | null,
): Promise<RetrievedContext> {
  const query = lastUserText(messages) || "evora modulos";
  const intent = detectIntent(query);
  const staff = role === "super_admin" || role === "admin" || role === "organizer";
  const rag = await hybridRetrieveAsync(query, {
    topK: intent === "modules_overview" ? 8 : 5,
    intent,
    usePgvector: true,
  });
  const pageBlock = formatPageContext(page);

  const docsBlock = [
    pageBlock,
    "RESULTADOS HYBRID RAG (documentos internos Evora):",
    rag.contextBlock,
    `Citas: ${rag.citations.join("; ")}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  switch (intent) {
    case "live_stats":
      return {
        intent,
        ragMode: "hybrid_mixed",
        requiredTools: staff
          ? ["getEventStats", "getCheckInStats"]
          : ["searchEvents", "getMyNextEvent"],
        citations: rag.citations,
        statusHint: "Consultando base de datos…",
        mustDo: staff
          ? "OBLIGATORIO: usa getEventStats y/o getCheckInStats. Prohibido inventar cifras."
          : "OBLIGATORIO: searchEvents o getMyNextEvent. No inventes totales globales.",
        contextText: docsBlock,
      };

    case "live_users":
      return {
        intent,
        ragMode: "live_sql",
        requiredTools: staff ? ["getUsersList"] : [],
        citations: rag.citations,
        statusHint: "Listando usuarios…",
        mustDo: staff
          ? "OBLIGATORIO: llama getUsersList."
          : "Sin permiso de listar usuarios; indícalo con claridad.",
        contextText: docsBlock,
      };

    case "live_registrations":
      return {
        intent,
        ragMode: "hybrid_mixed",
        requiredTools: staff
          ? ["getRegistrationsList", "getPaymentStatus"]
          : ["getMyTickets", "getPaymentStatus"],
        citations: rag.citations,
        statusHint: "Consultando inscripciones y pagos…",
        mustDo: staff
          ? "Usa getRegistrationsList y/o getPaymentStatus según la pregunta."
          : "Usa getMyTickets y/o getPaymentStatus. No inventes.",
        contextText: docsBlock,
      };

    case "my_tickets":
      return {
        intent,
        ragMode: "hybrid_mixed",
        requiredTools: ["getMyTickets", "getMyNextEvent"],
        citations: rag.citations,
        statusHint: "Buscando tus entradas…",
        mustDo: "OBLIGATORIO: getMyTickets o getMyNextEvent. No inventes entradas.",
        contextText: docsBlock,
      };

    case "audit":
      return {
        intent,
        ragMode: "hybrid_mixed",
        requiredTools: staff ? ["getAuditLogs"] : [],
        citations: rag.citations,
        statusHint: "Revisando auditoría…",
        mustDo: staff
          ? "OBLIGATORIO: llama getAuditLogs si tienes permiso."
          : "La auditoría es para administración.",
        contextText: docsBlock,
      };

    case "notifications":
      return {
        intent,
        ragMode: "hybrid_mixed",
        requiredTools: staff
          ? ["draftBroadcast", "previewMassNotification"]
          : ["getPlatformKnowledge"],
        citations: rag.citations,
        statusHint: "Preparando comunicaciones…",
        mustDo: staff
          ? "Puedes usar draftBroadcast para proponer texto y previewMassNotification antes de enviar."
          : "Explica notificaciones con el RAG; el miembro no envía broadcasts.",
        contextText: docsBlock,
      };

    case "live_events_search":
      return {
        intent,
        ragMode: "hybrid_mixed",
        requiredTools: ["searchEvents", "getMyNextEvent"],
        citations: rag.citations,
        statusHint: "Buscando eventos…",
        mustDo: "OBLIGATORIO: searchEvents o getMyNextEvent. No inventes eventos.",
        contextText: docsBlock,
      };

    case "transport":
      return {
        intent,
        ragMode: "hybrid_mixed",
        requiredTools: staff
          ? ["getTransportSeats", "getEventRoutes", "getPlatformKnowledge"]
          : ["getPlatformKnowledge"],
        citations: rag.citations,
        statusHint: "Consultando transporte…",
        mustDo: staff
          ? "Para asientos usa getTransportSeats. Para explicar el módulo usa el RAG."
          : "Explica transporte con el contexto RAG.",
        contextText: docsBlock,
      };

    case "module_detail":
    case "modules_overview":
    case "general_platform":
    case "unknown":
    default:
      return {
        intent,
        ragMode: "hybrid_docs",
        requiredTools: ["getPlatformKnowledge", "getMyPlanBilling"],
        citations: rag.citations,
        statusHint: "Buscando en la base de conocimiento…",
        mustDo: `Usa el CONTEXTO HYBRID RAG. Evora tiene ${PLATFORM_MODULE_COUNT} módulos. ${PLATFORM_OVERVIEW} Prohibido decir que no tienes contexto. Si falta detalle, llama getPlatformKnowledge. Para plan/límites: getMyPlanBilling.`,
        contextText: docsBlock,
      };
  }
}

export function appendRetrievedContextToSystem(
  systemPrompt: string,
  retrieved: RetrievedContext,
  role?: string,
): string {
  const profile = getRoleScopeProfile(role ?? "member");
  const isolation = buildRoleIsolationBlock(role ?? "member");

  // Filtra tools recomendadas a las permitidas del rol
  const allowed = new Set(profile.allowedToolsHint);
  const toolsForRole = retrieved.requiredTools.filter((t) => allowed.has(t));

  return `${systemPrompt}

---
${isolation}

---
PIPELINE RAG EVORA (Hybrid + Agentic) — Rol: ${profile.labelEs}
Modo: ${retrieved.ragMode}
Intención: ${retrieved.intent}
Tools recomendadas (solo las de tu rol): ${toolsForRole.join(", ") || "ninguna / rechazar si es de otro rol"}
Citas recuperadas: ${retrieved.citations.join("; ") || "n/a"}

${retrieved.mustDo}

${retrieved.contextText}

Instrucciones de generación:
1. Español profesional, sin ** ni emojis.
2. Solo datos de tools/RAG de ESTE rol (${profile.labelEs}). Alcance: ${profile.dataScopeEs}.
3. Si la pregunta es de otro rol, NO inventes: usa el mensaje de rechazo del aislamiento.
4. Cita módulos del RAG si aplica; no inventes cifras.
5. Si hay CONTEXTO DE PÁGINA, úsalo solo si esa ruta es coherente con tu rol.
6. No digas "como organizador/miembro/admin" si no es tu rol activo.`;
}
