"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  newsletterSubscribers,
  testimonials,
  registrations,
  events,
  organizations,
  tickets,
  type Testimonial,
} from "@/lib/db/schema";
import { eq, and, desc, asc, count, inArray, isNull } from "drizzle-orm";
import { getSystemSettings } from "@/lib/settings";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().email("Por favor ingresa un correo electrónico válido."),
  name: z.string().trim().max(120).optional(),
  source: z.string().optional().default("footer"),
});

export type SubscribeResult = {
  success: boolean;
  message: string;
  error?: string;
};

/**
 * Registra un correo en el boletín de novedades de la plataforma.
 */
export async function subscribeToNewsletterAction(
  prevState: unknown,
  formData: FormData
): Promise<SubscribeResult> {
  try {
    const rawEmail = formData.get("email");
    const rawName = formData.get("name");
    const rawSource = formData.get("source") || "footer";

    const parsed = subscribeSchema.safeParse({
      email: typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "",
      name: typeof rawName === "string" ? rawName.trim() : "",
      source: typeof rawSource === "string" ? rawSource : "footer",
    });

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Correo inválido.",
      };
    }

    let ipAddress: string | null = null;
    try {
      const headerList = await headers();
      const forwardedFor = headerList.get("x-forwarded-for");
      ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : headerList.get("x-real-ip") ?? null;
    } catch {
      // Safe fallback if headers() is called outside request store
    }

    // Verificar si ya existe
    const [existing] = await db
      .select({ id: newsletterSubscribers.id, status: newsletterSubscribers.status })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, parsed.data.email))
      .limit(1);

    if (existing) {
      if (existing.status !== "active") {
        await db
          .update(newsletterSubscribers)
          .set({
            status: "active",
            ...(parsed.data.name?.trim()
              ? { name: parsed.data.name.trim() }
              : {}),
            updatedAt: new Date(),
          })
          .where(eq(newsletterSubscribers.id, existing.id));
      }
      return {
        success: true,
        message: "¡Ya formas parte de nuestra comunidad! Te mantendremos al tanto.",
      };
    }

    await db.insert(newsletterSubscribers).values({
      email: parsed.data.email,
      name: parsed.data.name?.trim() || null,
      source: parsed.data.source,
      status: "active",
      ipAddress: ipAddress ?? undefined,
    });

    return {
      success: true,
      message: "¡Gracias por suscribirte! Revisa tu bandeja para las novedades.",
    };
  } catch (error) {
    console.error("[marketing] Error subscribing to newsletter:", error);
    return {
      success: false,
      message: "Ocurrió un error al procesar tu suscripción. Intenta nuevamente.",
    };
  }
}

/**
 * Obtiene testimonios reales destacados de la base de datos.
 */
export async function getPublicTestimonials(): Promise<Testimonial[]> {
  try {
    return await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.isFeatured, true))
      .orderBy(asc(testimonials.sortOrder), desc(testimonials.createdAt))
      .limit(6);
  } catch (error) {
    console.error("[marketing] Error fetching testimonials from DB:", error);
    return [];
  }
}

export type CommunityMetrics = {
  registeredAttendees: string;
  executedEvents: string;
  satisfactionRate: string;
  connectedCities: string;
  card1Title?: string;
  card1Subtitle?: string;
  card1ImageUrl?: string;
  card2Title?: string;
  card2Subtitle?: string;
  card2ImageUrl?: string;
};

/**
 * Calcula métricas dinámicas de la comunidad e impacto desde la base de datos.
 * El conteo de asistentes incluye exclusivamente aquellos con ticket emitido activo o usado
 * y sin retenciones (hold) pendientes.
 */
export async function getCommunityMetrics(): Promise<CommunityMetrics> {
  try {
    const [regResult, eventResult, orgResult, settings] = await Promise.all([
      db
        .select({ count: count() })
        .from(registrations)
        .innerJoin(tickets, eq(tickets.registrationId, registrations.id))
        .where(
          and(
            inArray(registrations.status, ["registered", "checked_in"]),
            inArray(tickets.status, ["active", "used"]),
            isNull(registrations.holdExpiresAt)
          )
        ),
      db
        .select({ count: count() })
        .from(events)
        .where(inArray(events.status, ["published", "completed"])),
      db
        .select({ count: count() })
        .from(organizations)
        .where(eq(organizations.isActive, true)),
      getSystemSettings().catch(() => null),
    ]);

    const regCount = Number(regResult[0]?.count ?? 0);
    const evCount = Number(eventResult[0]?.count ?? 0);
    const orgCount = Number(orgResult[0]?.count ?? 0);

    // Formatear métricas reales directamente desde los conteos de la base de datos
    const formattedAttendees =
      regCount > 0
        ? new Intl.NumberFormat("es-PE").format(regCount)
        : "0";

    const formattedEvents =
      evCount > 0
        ? new Intl.NumberFormat("es-PE").format(evCount)
        : "0";

    const formattedOrgs =
      orgCount > 0
        ? `${new Intl.NumberFormat("es-PE").format(orgCount)} ${orgCount === 1 ? "Organización" : "Organizaciones"}`
        : "0 Organizaciones";

    return {
      registeredAttendees: formattedAttendees,
      executedEvents: formattedEvents,
      satisfactionRate: settings?.impactSatisfactionRate || "99.8%",
      connectedCities: formattedOrgs,
      card1Title: settings?.impactCard1Title || "5+ años impulsando",
      card1Subtitle:
        settings?.impactCard1Subtitle ||
        "Eventos de tecnología, negocios e innovación en Latinoamérica.",
      card1ImageUrl: settings?.impactCard1ImageUrl || "",
      card2Title: settings?.impactCard2Title || "Más de 250 empresas",
      card2Subtitle:
        settings?.impactCard2Subtitle ||
        "Ya patrocinan y reclutan talento activamente en nuestros eventos.",
      card2ImageUrl: settings?.impactCard2ImageUrl || "",
    };
  } catch (error) {
    console.error("[marketing] Error computing community metrics:", error);
    return {
      registeredAttendees: "0",
      executedEvents: "0",
      satisfactionRate: "99.8%",
      connectedCities: "0 Organizaciones",
      card1Title: "5+ años impulsando",
      card1Subtitle: "Eventos de tecnología, negocios e innovación en Latinoamérica.",
      card1ImageUrl: "",
      card2Title: "Más de 250 empresas",
      card2Subtitle: "Ya patrocinan y reclutan talento activamente en nuestros eventos.",
      card2ImageUrl: "",
    };
  }
}
