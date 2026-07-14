import {
  PLATFORM_MODULE_COUNT,
  PLATFORM_OVERVIEW,
  normalizeQuery,
} from "./platform-knowledge";
import { hybridRetrieve } from "./rag";

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

export type RetrievedContext = {
  intent: ChatIntent;
  requiredTools: string[];
  contextText: string;
  mustDo: string;
  citations: string[];
  ragMode: "hybrid_docs" | "live_sql" | "hybrid_mixed";
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
  if (/(listar|lista|mostrar|ver).*(usuario|users)/.test(q) || /usuarios (de|en|registrados)/.test(q)) {
    return "live_users";
  }
  if (/(listar|lista|mostrar).*(inscrip|registro|asistente)/.test(q)) {
    return "live_registrations";
  }
  if (/(mis tickets|mis entradas|mi ticket|mi inscripción|mi inscripcion)/.test(q)) {
    return "my_tickets";
  }
  if (/(auditor|log de|actividad reciente|seguridad)/.test(q)) {
    return "audit";
  }
  if (/(notific|broadcast|comunicado|aviso masivo|enviar mensaje)/.test(q)) {
    return "notifications";
  }
  if (/(transporte|bus|ruta|paradero|asiento)/.test(q) && /(como|qué|que|donde|módulo|modulo|funciona)/.test(q)) {
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

/**
 * Agentic + Hybrid RAG:
 * - docs: hybridRetrieve (vector local + lexical)
 * - datos vivos: tools SQL
 */
export function retrieveChatContext(messages: unknown, role: string): RetrievedContext {
  const query = lastUserText(messages) || "evora modulos";
  const intent = detectIntent(query);
  const staff = role === "super_admin" || role === "admin" || role === "organizer";
  const rag = hybridRetrieve(query, intent === "modules_overview" ? 8 : 5);

  const docsBlock = [
    "RESULTADOS HYBRID RAG (documentos internos Evora):",
    rag.contextBlock,
    `Citas: ${rag.citations.join("; ")}`,
  ].join("\n\n");

  switch (intent) {
    case "live_stats":
      return {
        intent,
        ragMode: "hybrid_mixed",
        requiredTools: [staff ? "getEventStats" : "searchEvents"],
        citations: rag.citations,
        mustDo: staff
          ? "OBLIGATORIO: llama getEventStats ahora. Prohibido decir que no hay datos. Usa SOLO las cifras de la tool. Puedes apoyarte en el RAG solo para explicar qué significan."
          : "OBLIGATORIO: llama searchEvents. No inventes totales globales de miembro.",
        contextText: docsBlock,
      };

    case "live_users":
      return {
        intent,
        ragMode: "live_sql",
        requiredTools: staff ? ["getUsersList"] : [],
        citations: rag.citations,
        mustDo: staff
          ? "OBLIGATORIO: llama getUsersList."
          : "Sin permiso de listar usuarios; indícalo con claridad.",
        contextText: docsBlock,
      };

    case "live_registrations":
      return {
        intent,
        ragMode: "live_sql",
        requiredTools: staff ? ["getRegistrationsList"] : ["getMyTickets"],
        citations: rag.citations,
        mustDo: staff
          ? "OBLIGATORIO: llama getRegistrationsList."
          : "OBLIGATORIO: llama getMyTickets.",
        contextText: docsBlock,
      };

    case "my_tickets":
      return {
        intent,
        ragMode: "hybrid_mixed",
        requiredTools: ["getMyTickets"],
        citations: rag.citations,
        mustDo: "OBLIGATORIO: llama getMyTickets si el rol lo permite. No inventes entradas.",
        contextText: docsBlock,
      };

    case "audit":
      return {
        intent,
        ragMode: "hybrid_mixed",
        requiredTools: staff ? ["getAuditLogs"] : [],
        citations: rag.citations,
        mustDo: staff
          ? "OBLIGATORIO: llama getAuditLogs si tienes permiso."
          : "La auditoría es para administración.",
        contextText: docsBlock,
      };

    case "notifications":
      return {
        intent,
        ragMode: "hybrid_mixed",
        requiredTools: staff ? ["previewMassNotification"] : ["getPlatformKnowledge"],
        citations: rag.citations,
        mustDo: staff
          ? "Para envíos masivos: previewMassNotification primero. No inventes destinatarios."
          : "Explica notificaciones con el contexto RAG; el miembro no envía broadcasts.",
        contextText: docsBlock,
      };

    case "live_events_search":
      return {
        intent,
        ragMode: "hybrid_mixed",
        requiredTools: ["searchEvents"],
        citations: rag.citations,
        mustDo: "OBLIGATORIO: llama searchEvents. No inventes eventos.",
        contextText: docsBlock,
      };

    case "transport":
    case "module_detail":
    case "modules_overview":
    case "general_platform":
    case "unknown":
    default:
      return {
        intent,
        ragMode: "hybrid_docs",
        requiredTools: ["getPlatformKnowledge"],
        citations: rag.citations,
        mustDo: `Usa el CONTEXTO HYBRID RAG. Evora tiene ${PLATFORM_MODULE_COUNT} módulos. ${PLATFORM_OVERVIEW} Prohibido decir que no tienes contexto o idea sobre Evora. Si falta un detalle fino, llama getPlatformKnowledge con el topic de la pregunta.`,
        contextText: docsBlock,
      };
  }
}

export function appendRetrievedContextToSystem(
  systemPrompt: string,
  retrieved: RetrievedContext,
): string {
  return `${systemPrompt}

---
PIPELINE RAG EVORA (Hybrid + Agentic)
Modo: ${retrieved.ragMode}
Intención: ${retrieved.intent}
Tools de datos vivos recomendadas: ${retrieved.requiredTools.join(", ") || "ninguna"}
Citas recuperadas: ${retrieved.citations.join("; ") || "n/a"}

${retrieved.mustDo}

${retrieved.contextText}

Instrucciones de generación:
1. Responde en español, texto profesional, sin ** ni emojis.
2. Basate en las fuentes recuperadas y/o en el resultado exacto de las tools.
3. Si usas una fuente del RAG, puedes mencionar el módulo (ej. Según el módulo Pagos...).
4. Prohibido: "no tengo contexto", "no tengo idea", inventar cifras o módulos.`;
}
