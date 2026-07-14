import { z } from "zod";
import { db } from "@/lib/db";
import { payments, registrations, events, users } from "@/lib/db/schema";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import {
  canUseStaffChatTools,
  scopeEventsForChat,
  scopeRegistrationsForChat,
  type ChatToolScope,
} from "./scope";

export function createGetPaymentStatus(scope: ChatToolScope) {
  return {
    description:
      "Consulta el estado de un pago o inscripción (pending/approved/rejected). Busca por ID de registro, ID de pago, o email/nombre del asistente. No inventes estados.",
    parameters: z.object({
      query: z
        .string()
        .describe("ID de pago, ID de inscripción, email o nombre del asistente / evento"),
    }),
    execute: async ({ query }: { query: string }) => {
      try {
        const q = query.trim();
        if (!q) return { error: "Indica un ID, email o nombre para buscar el pago." };

        const isMember = scope.role === "member";
        const regScope = scopeRegistrationsForChat(scope);

        const search = or(
          eq(payments.id, q),
          eq(registrations.id, q),
          ilike(users.email, `%${q}%`),
          ilike(users.name, `%${q}%`),
          ilike(events.title, `%${q}%`),
        );

        const filters = [
          search,
          isMember ? eq(payments.userId, scope.userId) : undefined,
          !isMember && regScope ? regScope : undefined,
        ].filter(Boolean);

        const rows = await db
          .select({
            paymentId: payments.id,
            status: payments.status,
            amount: payments.amount,
            currency: payments.currency,
            method: payments.method,
            gatewayStatus: payments.gatewayStatus,
            createdAt: payments.createdAt,
            registrationId: payments.registrationId,
            eventTitle: events.title,
            userName: users.name,
            userEmail: users.email,
            registrationStatus: registrations.status,
          })
          .from(payments)
          .innerJoin(registrations, eq(payments.registrationId, registrations.id))
          .innerJoin(events, eq(registrations.eventId, events.id))
          .innerJoin(users, eq(payments.userId, users.id))
          .where(and(...filters))
          .orderBy(desc(payments.createdAt))
          .limit(8);

        if (rows.length === 0) {
          return {
            found: false,
            message: "No se encontró ningún pago con ese criterio en tu alcance.",
          };
        }

        return {
          source: "database",
          asOf: new Date().toISOString(),
          found: true,
          payments: rows.map((r) => ({
            paymentId: r.paymentId,
            registrationId: r.registrationId,
            status: r.status,
            amount: r.amount,
            currency: r.currency,
            method: r.method,
            gatewayStatus: r.gatewayStatus,
            event: r.eventTitle,
            attendee: isMember ? undefined : r.userName,
            email: isMember ? undefined : r.userEmail,
            registrationStatus: r.registrationStatus,
            createdAt: r.createdAt,
          })),
          grounding: "Usa SOLO estos registros. No inventes otros pagos.",
        };
      } catch (err) {
        console.error("getPaymentStatus:", err);
        return { error: "No se pudo consultar el estado del pago." };
      }
    },
  };
}

export function createGetCheckInStats(scope: ChatToolScope) {
  if (!canUseStaffChatTools(scope)) return null;

  return {
    description:
      "Resumen de check-in / asistencia QR: inscritos vs checked_in por evento. Útil para 'cuántos ingresaron'.",
    parameters: z.object({
      eventQuery: z.string().optional().describe("Título o parte del nombre del evento"),
    }),
    execute: async ({ eventQuery }: { eventQuery?: string }) => {
      try {
        const eventScope = scopeEventsForChat(scope);
        const eventFilters = [
          eventScope,
          eventQuery?.trim() ? ilike(events.title, `%${eventQuery.trim()}%`) : undefined,
        ].filter(Boolean);

        const eventRows = await db
          .select({ id: events.id, title: events.title, date: events.date })
          .from(events)
          .where(eventFilters.length ? and(...eventFilters) : undefined)
          .orderBy(desc(events.date))
          .limit(5);

        if (eventRows.length === 0) {
          return { found: false, message: "No hay eventos en tu alcance con ese criterio." };
        }

        const details = [];
        for (const ev of eventRows) {
          const [[{ total }], [{ checkedIn }]] = await Promise.all([
            db
              .select({ total: count() })
              .from(registrations)
              .where(eq(registrations.eventId, ev.id)),
            db
              .select({ checkedIn: count() })
              .from(registrations)
              .where(
                and(eq(registrations.eventId, ev.id), eq(registrations.status, "checked_in")),
              ),
          ]);
          details.push({
            eventId: ev.id,
            title: ev.title,
            date: ev.date,
            registered: Number(total),
            checkedIn: Number(checkedIn),
            pendingEntry: Math.max(0, Number(total) - Number(checkedIn)),
          });
        }

        return {
          source: "database",
          asOf: new Date().toISOString(),
          scanHint: "El staff escanea QR en /organizer/scan o /admin/scan.",
          events: details,
          grounding: "Copia enteros exactos. No inventes asistencias.",
        };
      } catch (err) {
        console.error("getCheckInStats:", err);
        return { error: "No se pudo calcular el check-in." };
      }
    },
  };
}
