import { PLATFORM_MODULES, PLATFORM_OVERVIEW, PLATFORM_MODULE_COUNT } from "../platform-knowledge";
import type { RagChunk } from "./types";

/**
 * Corpus canónico de Evora (base de conocimiento del RAG).
 * En producción avanzada estos chunks viven en PostgreSQL + pgvector;
 * aquí el índice se construye en memoria al arrancar el proceso.
 */
export function buildEvoraCorpus(): RagChunk[] {
  const chunks: RagChunk[] = [
    {
      id: "overview-core",
      title: "Qué es Evora",
      kind: "overview",
      tags: ["evora", "plataforma", "saas", "eventos", "sistema"],
      text: `Evora es una plataforma SaaS para gestionar el ciclo completo de eventos: publicación, inscripción, pago, transporte, acceso en puerta y operación del negocio. Tiene exactamente ${PLATFORM_MODULE_COUNT} módulos principales. ${PLATFORM_OVERVIEW}`,
    },
    {
      id: "overview-modules-list",
      title: "Inventario de 11 módulos",
      kind: "overview",
      tags: ["modulos", "módulos", "inventario", "lista"],
      text: `La plataforma Evora tiene ${PLATFORM_MODULE_COUNT} módulos: 1 Público y marketing, 2 Autenticación y cuentas, 3 Eventos, 4 Inscripciones y tickets, 5 Pagos, 6 Transporte, 7 Organizaciones, 8 Planes y billing SaaS, 9 Comunicaciones, 10 Admin y operaciones, 11 IA y extras.`,
    },
    {
      id: "policy-no-hallucinate",
      title: "Política de respuestas con datos",
      kind: "policy",
      tags: ["datos", "cifras", "estadisticas", "conteos"],
      text: `Las cifras de eventos, usuarios, inscripciones y tickets solo pueden tomarse de herramientas conectadas a la base de datos (getEventStats, searchEvents, getUsersList, getRegistrationsList, getMyTickets, getAuditLogs). El inventario de módulos es conocimiento canónico y no se inventa.`,
    },
    {
      id: "howto-checkout",
      title: "Cómo pagar una inscripción",
      kind: "howto",
      moduleId: 5,
      moduleName: "Pagos",
      tags: ["checkout", "pagar", "culqi", "yape", "tarjeta"],
      text: `Tras registrarse en un evento, el asistente paga en /checkout/[registrationId] con Culqi (tarjeta, Yape y billeteras vía pasarela) o efectivo en puerta si el organizador lo habilita. Estados de pago: pending, approved, rejected.`,
    },
    {
      id: "howto-scan",
      title: "Cómo hacer check-in con QR",
      kind: "howto",
      moduleId: 10,
      moduleName: "Admin y operaciones",
      tags: ["scan", "scanner", "qr", "checkin", "ingreso"],
      text: `El staff escanea el QR del ticket en /organizer/scan o /admin/scan. Se valida la firma criptográfica del ticket y se marca la asistencia (checked_in).`,
    },
    {
      id: "howto-register",
      title: "Cómo inscribirse a un evento",
      kind: "howto",
      moduleId: 4,
      moduleName: "Inscripciones y tickets",
      tags: ["inscribirse", "registro", "ticket", "entrar"],
      text: `El usuario encuentra el evento en /events o /events/[slug], se registra, puede añadir invitados y obtiene un ticket digital con QR. Luego completa el pago en checkout si el evento lo requiere.`,
    },
    {
      id: "route-panels",
      title: "Paneles por rol",
      kind: "route",
      moduleId: 10,
      moduleName: "Admin y operaciones",
      tags: ["panel", "dashboard", "rol", "superadmin", "member"],
      text: `Hay paneles por rol: /superadmin, /admin, /organizer, /member y /attendee (staff actuando como asistente). Cada uno muestra solo las funciones y datos de su alcance.`,
    },
  ];

  for (const m of PLATFORM_MODULES) {
    chunks.push({
      id: `module-${m.id}`,
      title: `Módulo ${m.id}: ${m.name}`,
      kind: "module",
      moduleId: m.id,
      moduleName: m.name,
      tags: [m.name, ...m.synonyms].map((t) => t.toLowerCase()),
      text: `Módulo ${m.id}. ${m.name}. ${m.summary}${m.details ? ` ${m.details}` : ""}`,
    });

    m.faqs.forEach((faq, idx) => {
      chunks.push({
        id: `faq-${m.id}-${idx + 1}`,
        title: `${m.name} — detalle ${idx + 1}`,
        kind: "faq",
        moduleId: m.id,
        moduleName: m.name,
        tags: [m.name, ...m.synonyms.slice(0, 8)].map((t) => t.toLowerCase()),
        text: faq,
      });
    });
  }

  return chunks;
}
