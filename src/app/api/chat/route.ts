import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { db } from "@/lib/db";
import { users, events, registrations, activityLogs, notifications, transportRoutes, transportBookings } from "@/lib/db/schema";
import { sendPushNotification } from "@/lib/notifications/push";
import { sendCustomNotificationEmail } from "@/lib/mail";
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

    if (userRole === "super_admin" || userRole === "admin" || userRole === "organizer") {
      systemPrompt += `
Herramientas de Comunicación Masiva:
- Tienes acceso a 'getEventRoutes' para consultar las rutas de transporte asociadas a un evento y a 'sendMassNotification' para enviar alertas a todos los inscritos del evento o a todos los pasajeros de una ruta de bus.
- IMPORTANTE (Doble Confirmación Conversacional): Cuando el usuario te pida enviar un mensaje masivo o una alerta de emergencia:
  1. Primero debes redactar o refinar el mensaje redactando un Borrador que contenga de forma muy visible:
     - Destinatarios (ej: "Todos los asistentes al Retiro de Jóvenes" o "Pasajeros de la Ruta Bus Norte").
     - Título/Asunto del mensaje.
     - Contenido/Mensaje completo.
  2. Pídele al usuario su confirmación explícita mediante una pregunta como: "¿Deseas que proceda a enviar esta notificación masiva ahora mismo?".
  3. BAJO NINGUNA CIRCUNSTANCIA debes invocar la herramienta 'sendMassNotification' antes de que el usuario te responda afirmativamente (ej: "sí", "envíalo", "aceptar", "confirmar", "procede"). Si te lo pide inicialmente, primero genera el borrador y pide la confirmación de manera conversacional en tu respuesta.
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

      tools.getEventRoutes = {
        description: "Obtiene las rutas de transporte y buses asociadas a un evento específico.",
        parameters: z.object({
          eventId: z.string().uuid().describe("El ID único del evento para buscar sus rutas de transporte."),
        }),
        execute: async ({ eventId }: { eventId: string }) => {
          try {
            const routes = await db
              .select()
              .from(transportRoutes)
              .where(
                and(
                  eq(transportRoutes.eventId, eventId),
                  eq(transportRoutes.isActive, true)
                )
              )
              .orderBy(desc(transportRoutes.departureTime));

            if (routes.length === 0) {
              return { message: "No se encontraron rutas de transporte activas para este evento." };
            }

            return routes.map((r) => ({
              id: r.id,
              name: r.name,
              departurePoint: r.departurePoint,
              departureTime: new Date(r.departureTime).toLocaleString("es-PE"),
              pricePerSeat: `S/ ${Number(r.pricePerSeat).toFixed(2)}`,
              totalSeats: r.totalSeats,
              description: r.description ?? "Sin descripción",
            }));
          } catch (err) {
            console.error("Error in getEventRoutes tool:", err);
            return { error: "No se pudieron obtener las rutas de transporte del evento." };
          }
        },
      };

      tools.sendMassNotification = {
        description: "Envía una notificación masiva (in-app, push, email) a todos los asistentes a un evento o a todos los pasajeros de una ruta de bus específica. ¡IMPORTANTE! Antes de llamar a esta herramienta, debes haber mostrado un borrador del mensaje y obtenido la aprobación explícita del usuario.",
        parameters: z.object({
          eventId: z.string().uuid().describe("El ID único del evento."),
          target: z.enum(["all_attendees", "route_passengers"]).describe("El grupo objetivo: todos los inscritos del evento o solo los pasajeros de una ruta de bus."),
          routeId: z.string().uuid().optional().describe("El ID de la ruta de bus (obligatorio si target es 'route_passengers')."),
          title: z.string().describe("El título o asunto de la notificación (breve y urgente, ej: 'Demora en Salida de Bus')."),
          body: z.string().describe("El contenido detallado de la notificación con la información de emergencia o coordinación."),
        }),
        execute: async ({ eventId, target, routeId, title, body }: { eventId: string; target: "all_attendees" | "route_passengers"; routeId?: string; title: string; body: string }) => {
          try {
            // Verificar primero si el evento existe
            const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
            if (!event) {
              return { error: "El evento especificado no existe." };
            }

            let recipients: { id: string; name: string; email: string }[] = [];

            if (target === "all_attendees") {
              // Obtener todos los usuarios registrados (que no estén cancelados)
              recipients = await db
                .select({
                  id: users.id,
                  name: users.name,
                  email: users.email,
                })
                .from(registrations)
                .innerJoin(users, eq(registrations.userId, users.id))
                .where(
                  and(
                    eq(registrations.eventId, eventId),
                    ne(registrations.status, "cancelled")
                  )
                );
            } else if (target === "route_passengers") {
              if (!routeId) {
                return { error: "El parámetro routeId es obligatorio para enviar notificaciones a pasajeros de una ruta." };
              }
              // Verificar si la ruta existe
              const [route] = await db.select().from(transportRoutes).where(eq(transportRoutes.id, routeId)).limit(1);
              if (!route) {
                return { error: "La ruta de transporte especificada no existe." };
              }

              // Obtener todos los usuarios con reservas confirmadas o pendientes (que no estén cancelados) en esta ruta
              recipients = await db
                .select({
                  id: users.id,
                  name: users.name,
                  email: users.email,
                })
                .from(transportBookings)
                .innerJoin(users, eq(transportBookings.userId, users.id))
                .where(
                  and(
                    eq(transportBookings.routeId, routeId),
                    ne(transportBookings.status, "cancelled")
                  )
                );
            }

            if (recipients.length === 0) {
              return { message: "No se encontraron destinatarios activos para este grupo de envío." };
            }

            // Desduplicar destinatarios por ID
            const uniqueRecipients = Array.from(new Map(recipients.map(item => [item.id, item])).values());

            // Enviar notificaciones en paralelo/lotes
            let successCount = 0;
            let failCount = 0;

            const sendPromises = uniqueRecipients.map(async (user) => {
              try {
                // 1. Notificación In-App (Insertar en base de datos)
                await db.insert(notifications).values({
                  userId: user.id,
                  type: "event_reminder",
                  title: title,
                  message: body,
                  read: false,
                  metadata: {
                    eventId,
                    routeId: routeId || null,
                    sentBy: userId,
                    targetGroup: target,
                  },
                });

                // 2. Notificación Web Push
                try {
                  await sendPushNotification(user.id, title, body);
                } catch (pushErr) {
                  console.error(`Failed to send push notification to user ${user.id}:`, pushErr);
                }

                // 3. Notificación Email
                try {
                  await sendCustomNotificationEmail({
                    email: user.email,
                    name: user.name,
                    subject: title,
                    body: body,
                  });
                } catch (emailErr) {
                  console.error(`Failed to send email to user ${user.email}:`, emailErr);
                }

                successCount++;
              } catch (err) {
                console.error(`Failed to process notification for user ${user.id}:`, err);
                failCount++;
              }
            });

            // Esperar que se completen todos los envíos
            await Promise.all(sendPromises);

            // Loguear la acción en logs de auditoría
            try {
              await db.insert(activityLogs).values({
                actorId: userId,
                actorName: userName,
                action: "send_mass_notification",
                entityType: "notification",
                entityId: eventId,
                details: `Notificación masiva enviada a ${successCount} destinatarios de ${target === "all_attendees" ? "asistentes al evento" : "pasajeros de bus"}. Asunto: "${title}".`,
              });
            } catch (auditErr) {
              console.error("Failed to log activity log:", auditErr);
            }

            return {
              success: true,
              totalSent: successCount,
              totalFailed: failCount,
              message: `Se enviaron exitosamente ${successCount} notificaciones masivas a través de In-App, Web Push y Correo Electrónico (fallaron ${failCount}).`,
            };
          } catch (err) {
            console.error("Error in sendMassNotification tool:", err);
            return { error: "Ocurrió un error inesperado al procesar el envío masivo." };
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
