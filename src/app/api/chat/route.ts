import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { db } from "@/lib/db";
import { users, events, registrations, activityLogs } from "@/lib/db/schema";
import { and, eq, ilike, or, desc, count, ne } from "drizzle-orm";
import { z } from "zod";
import { env } from "@/env";
import { normalizeRole } from "@/lib/auth/rbac";

export const maxDuration = 30;

// Configurar el proveedor oficial de Google con la API Key del usuario
const googleProvider = createGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // 1. Validar la sesión del usuario
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { messages } = await req.json();
    const userRole = normalizeRole(session.user.role ?? "member");
    const userName = session.user.name ?? "Usuario";
    const userId = session.user.id;

    // 2. Definir el System Prompt según el Rol del usuario
    let systemPrompt = `Eres "FeBot", el Asistente Inteligente oficial de la plataforma de eventos comunitarios "EncuentroDeFe".
Tu objetivo es ayudar de forma amable, profesional y precisa. Te comunicas en español de forma respetuosa y atenta.
Estás conversando con ${userName}, quien tiene el rol de: ${userRole}.
Dato importante: La fecha y hora actual del servidor es ${new Date().toLocaleString("es-PE")}.

Instrucciones generales de comportamiento:
- Responde siempre de forma clara, directa y estructurada en formato Markdown.
- Mantén tus respuestas enfocadas en la gestión de eventos, transporte, entradas y datos de la comunidad.
- Si te piden realizar un proceso que requiera una herramienta, usa la herramienta adecuada.
- Si el usuario te pregunta por algo fuera del alcance de la plataforma, responde amablemente que tu propósito es asistir en EncuentroDeFe.
`;

    if (userRole === "super_admin" || userRole === "admin") {
      systemPrompt += `
Como Administrador de la plataforma, tienes acceso a herramientas avanzadas del sistema:
- Puedes buscar eventos de forma global.
- Puedes consultar estadísticas generales de la plataforma (métricas globales) mediante la herramienta 'getEventStats'.
- Puedes consultar los registros de auditoría de seguridad mediante la herramienta 'getAuditLogs' para monitorear acciones recientes.
Sé sumamente precavido y profesional con los datos sensibles que manejes.
`;
    } else if (userRole === "organizer") {
      systemPrompt += `
Como Organizador de eventos, puedes gestionar la logística de tus encuentros:
- Puedes buscar eventos.
- Puedes consultar estadísticas generales y de asistencia mediante 'getEventStats' para analizar el éxito de los eventos.
Apoya a los organizadores a simplificar la planificación de sus actividades comunitarias.
`;
    } else {
      systemPrompt += `
Como Miembro de la comunidad, eres asistente a los eventos:
- Puedes buscar eventos de forma semántica con la herramienta 'searchEvents'.
- Puedes revisar tus entradas y tickets activos mediante la herramienta 'getMyTickets'.
Ayuda al miembro a encontrar su próximo encuentro espiritual o comunitario y a coordinar su traslado y entradas.
`;
    }

    // 3. Definir herramientas dinámicas basadas en el Rol (Function Calling)
    const tools: Record<string, any> = {};

    // Herramienta disponible para TODOS los roles
    tools.searchEvents = {
      description: "Busca eventos activos en la plataforma filtrando por título, descripción o categoría.",
      parameters: z.object({
        query: z.string().describe("El texto de búsqueda (ej. 'retiro', 'oración', 'jóvenes')"),
      }),
      execute: async ({ query }: { query: string }) => {
        try {
          const lowerQuery = query.toLowerCase().trim();
          const isLatestQuery = ["ultimo", "último", "reciente", "recientes", "últimos", "ultimos", "creado"].some(k => lowerQuery.includes(k));
          const isGeneralQuery = !query || isLatestQuery || ["all", "todos", "any"].includes(lowerQuery);

          const queryFilter = isGeneralQuery
            ? eq(events.status, "published")
            : and(
                eq(events.status, "published"),
                or(
                  ilike(events.title, `%${query}%`),
                  ilike(events.description, `%${query}%`),
                  ilike(events.category, `%${query}%`)
                )
              );

          const results = await db
            .select()
            .from(events)
            .where(queryFilter)
            .orderBy(isLatestQuery ? desc(events.createdAt) : desc(events.date))
            .limit(5);

          if (results.length === 0) {
            return { message: "No se encontraron eventos activos coincidentes." };
          }

          return results.map((e) => ({
            id: e.id,
            title: e.title,
            description: e.description ? e.description.substring(0, 100) + "..." : "Sin descripción",
            category: e.category,
            date: new Date(e.date).toLocaleString("es-PE"),
            location: e.isVirtual ? "Virtual (Enlace disponible al inscribirse)" : (e.location ?? "Por confirmar"),
            price: e.price ? `S/ ${Number(e.price).toFixed(2)}` : "Gratuito",
            capacity: e.capacity ?? "Ilimitada",
          }));
        } catch (err) {
          console.error("Error in searchEvents tool:", err);
          return { error: "No se pudo realizar la búsqueda de eventos." };
        }
      },
    };

    // Herramienta disponible solo para MIEMBROS
    if (userRole === "member") {
      tools.getMyTickets = {
        description: "Obtiene las entradas y tickets de eventos activos registrados por el miembro conectado.",
        parameters: z.object({}),
        execute: async () => {
          try {
            const results = await db
              .select({
                registrationId: registrations.id,
                registrationStatus: registrations.status,
                eventTitle: events.title,
                eventDate: events.date,
                eventLocation: events.location,
                isVirtual: events.isVirtual,
              })
              .from(registrations)
              .innerJoin(events, eq(registrations.eventId, events.id))
              .where(
                and(
                  eq(registrations.userId, userId),
                  ne(registrations.status, "cancelled")
                )
              )
              .orderBy(desc(registrations.registeredAt));

            if (results.length === 0) {
              return { message: "Aún no tienes inscripciones o tickets registrados." };
            }

            return results.map((r) => ({
              ticketId: r.registrationId,
              event: r.eventTitle,
              date: new Date(r.eventDate).toLocaleString("es-PE"),
              location: r.isVirtual ? "Virtual" : (r.eventLocation ?? "Por confirmar"),
              status: r.registrationStatus === "checked_in" ? "Ingresado (Asistencia confirmada)" : "Registrado (Pendiente de ingreso)",
            }));
          } catch (err) {
            console.error("Error in getMyTickets tool:", err);
            return { error: "No se pudo cargar tu historial de tickets." };
          }
        },
      };
    }

    // Herramienta disponible para ADMINS y ORGANIZADORES
    if (userRole === "super_admin" || userRole === "admin" || userRole === "organizer") {
      tools.getEventStats = {
        description: "Obtiene estadísticas clave de la plataforma sobre usuarios, eventos y registros totales.",
        parameters: z.object({}),
        execute: async () => {
          try {
            // Contar usuarios
            const [{ usersCount }] = await db.select({ usersCount: count() }).from(users);
            
            // Contar eventos
            const [{ eventsCount }] = await db.select({ eventsCount: count() }).from(events);
            
            // Contar inscripciones
            const [{ regsCount }] = await db.select({ regsCount: count() }).from(registrations);
            
            // Contar eventos publicados
            const [{ publishedCount }] = await db
              .select({ publishedCount: count() })
              .from(events)
              .where(eq(events.status, "published"));

            return {
              totalUsers: usersCount,
              totalEvents: eventsCount,
              totalRegistrations: regsCount,
              publishedEvents: publishedCount,
              auditNote: "Métricas obtenidas directamente en tiempo real."
            };
          } catch (err) {
            console.error("Error in getEventStats tool:", err);
            return { error: "No se pudieron calcular las estadísticas de la plataforma." };
          }
        },
      };
    }

    // Herramienta disponible SOLO para ADMINISTRADORES
    if (userRole === "super_admin" || userRole === "admin") {
      tools.getAuditLogs = {
        description: "Obtiene los últimos 5 logs de auditoría de seguridad del sistema para revisar acciones administrativas.",
        parameters: z.object({}),
        execute: async () => {
          try {
            const logs = await db
              .select()
              .from(activityLogs)
              .orderBy(desc(activityLogs.createdAt))
              .limit(5);

            if (logs.length === 0) {
              return { message: "No se encontraron logs de auditoría registrados." };
            }

            return logs.map((l) => ({
              id: l.id,
              date: new Date(l.createdAt).toLocaleString("es-PE"),
              actor: l.actorName,
              action: l.action,
              module: l.entityType,
              details: l.details ?? "Sin detalles",
            }));
          } catch (err) {
            console.error("Error in getAuditLogs tool:", err);
            return { error: "No se pudieron recuperar los logs de auditoría de seguridad." };
          }
        },
      };
    }

    // 4. Invocar a Gemini con soporte de Streaming y Function Calling del SDK de Vercel
    const result = streamText({
      model: googleProvider(env.GEMINI_MODEL),
      messages: await convertToModelMessages(messages),
      system: systemPrompt,
      tools,
      maxRetries: 0, // Evitar reintentos automáticos inmediatos que agoten la cuota de peticiones ante errores 429
      stopWhen: stepCountIs(5), // Permitir al modelo encadenar llamadas a herramientas (Multi-turn Tool Calling)
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error in Chat API Route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar la conversación." },
      { status: 500 }
    );
  }
}
