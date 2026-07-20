import { z } from "zod";
import { db } from "@/lib/db";
import {
  events,
  transportRoutes,
  transportBookings,
  subscriptions,
  plans,
  registrations,
} from "@/lib/db/schema";
import { and, desc, eq, gte, sql, sum } from "drizzle-orm";
import {
  canUseStaffChatTools,
  scopeEventsForChat,
  type ChatToolScope,
} from "./scope";
import { getResolvedPlanForUser } from "@/lib/billing/enforce";
import { getAiChatUsage } from "@/lib/billing/ai-chat-usage";

export function createGetMyPlanBilling(scope: ChatToolScope) {
  return {
    description:
      "Devuelve el plan SaaS actual del usuario/organización: límites (eventos, IA, broadcasts), features (Culqi, transporte, IA) y uso de mensajes IA este mes.",
    parameters: z.object({}),
    execute: async () => {
      try {
        const plan = await getResolvedPlanForUser(scope.userId, scope.role);
        const aiUsage = await getAiChatUsage(scope.userId, scope.role);

        let subscription: {
          status: string;
          periodEnd: Date | null;
        } | null = null;

        const sub = await db
          .select({
            status: subscriptions.status,
            periodEnd: subscriptions.currentPeriodEnd,
            planName: plans.name,
          })
          .from(subscriptions)
          .innerJoin(plans, eq(subscriptions.planId, plans.id))
          .where(eq(subscriptions.userId, scope.userId))
          .orderBy(desc(subscriptions.updatedAt))
          .limit(1);

        if (sub[0]) {
          subscription = {
            status: sub[0].status,
            periodEnd: sub[0].periodEnd,
          };
        }

        return {
          source: "database",
          asOf: new Date().toISOString(),
          plan: {
            name: plan.name,
            slug: plan.slug,
            maxActiveEvents: plan.maxActiveEvents,
            maxAiMessagesPerMonth: plan.maxAiMessagesPerMonth,
            maxBroadcastsPerMonth: plan.maxBroadcastsPerMonth,
            featureCulqi: plan.features.culqi,
            featureTransport: plan.features.transport,
            featureAi: plan.features.ai,
            featureExports: plan.features.exports,
          },
          aiUsage,
          subscription,
          grounding: "Usa solo estos límites. No inventes precios ni cupos.",
        };
      } catch (err) {
        console.error("getMyPlanBilling:", err);
        return { error: "No se pudo cargar el plan / billing." };
      }
    },
  };
}

export function createGetTransportSeats(scope: ChatToolScope) {
  if (!canUseStaffChatTools(scope)) return null;

  return {
    description:
      "Asientos de transporte: rutas, capacidad, reservados y disponibles por evento. Úsalo para 'cuántos asientos quedan'.",
    parameters: z.object({
      eventQuery: z.string().optional().describe("Nombre del evento (opcional)"),
    }),
    execute: async ({ eventQuery }: { eventQuery?: string }) => {
      try {
        const eventScope = scopeEventsForChat(scope);
        const filters = [
          eventScope,
          eventQuery?.trim()
            ? sql`${events.title} ILIKE ${`%${eventQuery.trim()}%`}`
            : undefined,
        ].filter(Boolean);

        const routes = await db
          .select({
            routeId: transportRoutes.id,
            routeName: transportRoutes.name,
            totalSeats: transportRoutes.totalSeats,
            eventId: events.id,
            eventTitle: events.title,
            departureTime: transportRoutes.departureTime,
            isActive: transportRoutes.isActive,
          })
          .from(transportRoutes)
          .innerJoin(events, eq(transportRoutes.eventId, events.id))
          .where(filters.length ? and(...filters) : undefined)
          .orderBy(desc(transportRoutes.departureTime))
          .limit(15);

        if (routes.length === 0) {
          return { found: false, message: "No hay rutas de transporte en tu alcance." };
        }

        const result = [];
        for (const r of routes) {
          const [booked] = await db
            .select({
              seats: sum(transportBookings.seats),
            })
            .from(transportBookings)
            .where(
              and(
                eq(transportBookings.routeId, r.routeId),
                sql`${transportBookings.status} <> 'cancelled'`,
              ),
            );
          const used = Number(booked?.seats ?? 0);
          result.push({
            routeId: r.routeId,
            route: r.routeName,
            event: r.eventTitle,
            totalSeats: r.totalSeats,
            bookedSeats: used,
            availableSeats: Math.max(0, r.totalSeats - used),
            departureTime: r.departureTime,
            isActive: r.isActive,
          });
        }

        return {
          source: "database",
          asOf: new Date().toISOString(),
          routes: result,
          grounding: "Copia enteros exactos de asientos.",
        };
      } catch (err) {
        console.error("getTransportSeats:", err);
        return { error: "No se pudo consultar asientos de transporte." };
      }
    },
  };
}

export function createGetMyNextEvent(scope: ChatToolScope) {
  return {
    description:
      "Próximo evento relevante: para miembros, su próxima inscripción activa; para staff, el próximo evento publicado en su alcance.",
    parameters: z.object({}),
    execute: async () => {
      try {
        const now = new Date();

        if (scope.role === "member") {
          const rows = await db
            .select({
              registrationId: registrations.id,
              status: registrations.status,
              title: events.title,
              date: events.date,
              location: events.location,
              slug: events.slug,
              isVirtual: events.isVirtual,
            })
            .from(registrations)
            .innerJoin(events, eq(registrations.eventId, events.id))
            .where(
              and(
                eq(registrations.userId, scope.userId),
                gte(events.date, now),
                sql`${registrations.status} <> 'cancelled'`,
              ),
            )
            .orderBy(events.date)
            .limit(3);

          if (rows.length === 0) {
            return { found: false, message: "No tienes próximos eventos inscritos." };
          }
          return {
            source: "database",
            asOf: new Date().toISOString(),
            upcoming: rows.map((r) => ({
              registrationId: r.registrationId,
              event: r.title,
              date: r.date,
              location: r.isVirtual ? "Virtual" : r.location,
              status: r.status,
              url: `/events/${r.slug}`,
            })),
          };
        }

        const eventScope = scopeEventsForChat(scope);
        const rows = await db
          .select({
            id: events.id,
            title: events.title,
            date: events.date,
            status: events.status,
            slug: events.slug,
            location: events.location,
          })
          .from(events)
          .where(
            and(
              eventScope,
              gte(events.date, now),
              eq(events.status, "published"),
            ),
          )
          .orderBy(events.date)
          .limit(5);

        if (rows.length === 0) {
          return { found: false, message: "No hay próximos eventos publicados en tu alcance." };
        }

        return {
          source: "database",
          asOf: new Date().toISOString(),
          upcoming: rows.map((r) => ({
            eventId: r.id,
            event: r.title,
            date: r.date,
            status: r.status,
            location: r.location,
            url: `/events/${r.slug}`,
          })),
        };
      } catch (err) {
        console.error("getMyNextEvent:", err);
        return { error: "No se pudo obtener el próximo evento." };
      }
    },
  };
}

export function createDraftBroadcast(scope: ChatToolScope) {
  if (!canUseStaffChatTools(scope)) return null;

  return {
    description:
      "Genera un borrador de comunicación masiva (broadcast) con asunto y cuerpo listos, usando datos reales del evento si se indica. NO envía; solo propone texto. Luego el usuario puede usar previewMassNotification.",
    parameters: z.object({
      topic: z.string().describe("Tema del mensaje (recordatorio, cambio de horario, etc.)"),
      eventQuery: z.string().optional().describe("Evento relacionado (opcional)"),
      tone: z
        .enum(["formal", "cercano", "urgente"])
        .optional()
        .describe("Tono del mensaje"),
    }),
    execute: async ({
      topic,
      eventQuery,
      tone = "formal",
    }: {
      topic: string;
      eventQuery?: string;
      tone?: "formal" | "cercano" | "urgente";
    }) => {
      try {
        let eventTitle = "tu evento";
        let eventDate = "";
        let eventLocation = "";

        if (eventQuery?.trim()) {
          const eventScope = scopeEventsForChat(scope);
          const [ev] = await db
            .select({
              title: events.title,
              date: events.date,
              location: events.location,
              isVirtual: events.isVirtual,
            })
            .from(events)
            .where(
              and(
                eventScope,
                sql`${events.title} ILIKE ${`%${eventQuery.trim()}%`}`,
              ),
            )
            .limit(1);
          if (ev) {
            eventTitle = ev.title;
            eventDate = new Date(ev.date).toLocaleString("es-PE");
            eventLocation = ev.isVirtual ? "Virtual" : (ev.location ?? "por confirmar");
          }
        }

        const subjectByTone = {
          formal: `Aviso: ${topic} — ${eventTitle}`,
          cercano: `${eventTitle}: ${topic}`,
          urgente: `Urgente — ${topic} (${eventTitle})`,
        };

        const body = [
          tone === "cercano" ? `Hola,` : `Estimado/a participante,`,
          ``,
          `Te escribimos respecto a ${topic} en el evento «${eventTitle}».`,
          eventDate ? `Fecha: ${eventDate}.` : null,
          eventLocation ? `Lugar: ${eventLocation}.` : null,
          ``,
          `Si ya tienes tu entrada, llévala (QR) el día del evento. Si tienes dudas, responde a este canal o entra a tu panel Enquiva.`,
          ``,
          `Saludos,`,
          `Equipo organizador`,
        ]
          .filter((l) => l !== null)
          .join("\n");

        return {
          source: "draft",
          asOf: new Date().toISOString(),
          draft: {
            subject: subjectByTone[tone],
            body,
            suggestedNextTool: "previewMassNotification",
            note: "Esto es un BORRADOR. No se envió nada. Usa previewMassNotification para estimar destinatarios antes de sendMassNotification.",
          },
        };
      } catch (err) {
        console.error("draftBroadcast:", err);
        return { error: "No se pudo generar el borrador." };
      }
    },
  };
}
