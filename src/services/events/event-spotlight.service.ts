import { db } from "@/lib/db";
import { events, registrations } from "@/lib/db/schema";
import { eq, and, gte, sql, desc, asc, inArray, or, isNull, gt } from "drizzle-orm";
import { getCached, setCached, CACHE_KEYS, CACHE_TTL } from "@/lib/redis";
import type { SystemSettings } from "@/lib/settings";
import { OCCUPYING_REGISTRATION_STATUSES } from "@/lib/registrations/constants";

export type EventSpotlightBadgeType = "popular" | "upcoming" | "few_tickets" | "pinned" | "new";

export interface EventSpotlightData {
  id: string;
  title: string;
  slug: string;
  date: string;
  endDate: string | null;
  location: string | null;
  isVirtual: boolean;
  price: string | null;
  coverImage: string | null;
  badge: {
    type: EventSpotlightBadgeType;
    label: string;
    variant: "fire" | "clock" | "bolt" | "star";
  };
  highlightMessage: string;
  spotsLeft: number | null;
  attendeeCount: number;
  capacity: number | null;
}

const activeOccupyingStatus = and(
  inArray(registrations.status, [...OCCUPYING_REGISTRATION_STATUSES]),
  or(isNull(registrations.holdExpiresAt), gt(registrations.holdExpiresAt, sql`now()`)),
);

export class EventSpotlightService {
  /**
   * Retorna la lista de eventos publicados y futuros para el selector del Super Admin.
   */
  static async getPublishedEventsForAdminSelect() {
    try {
      const rows = await db
        .select({
          id: events.id,
          title: events.title,
          slug: events.slug,
          date: events.date,
          status: events.status,
        })
        .from(events)
        .where(eq(events.status, "published"))
        .orderBy(desc(events.date))
        .limit(50);

      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        date: r.date.toISOString(),
      }));
    } catch (error) {
      console.error("Error fetching published events for admin select:", error);
      return [];
    }
  }

  /**
   * Obtiene el evento actual a mostrar en el Top Banner de acuerdo a la configuración.
   */
  static async getSpotlightEvent(settings: SystemSettings): Promise<EventSpotlightData | null> {
    if (!settings.eventBannerEnabled) {
      return null;
    }

    const cacheKey = `${CACHE_KEYS.eventSpotlight}:${settings.eventBannerMode}:${settings.eventBannerCriteria}:${settings.eventBannerPinnedEventId ?? "none"}:${settings.eventBannerCustomBadge || "none"}`;

    const cached = await getCached<EventSpotlightData>(cacheKey);
    if (cached) return cached;

    const now = new Date();

    // 1. MODO PINNED (Super Admin eligió un evento específico)
    if (settings.eventBannerMode === "pinned" && settings.eventBannerPinnedEventId) {
      const [pinnedEvent] = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.id, settings.eventBannerPinnedEventId),
            eq(events.status, "published"),
          ),
        )
        .limit(1);

      if (pinnedEvent) {
        const attendeeCount = await this.getAttendeeCount(pinnedEvent.id);
        const spotsLeft = pinnedEvent.capacity
          ? Math.max(0, pinnedEvent.capacity - attendeeCount)
          : null;

        const customBadge = settings.eventBannerCustomBadge?.trim();
        const customText = settings.eventBannerCustomText?.trim();

        const badgeLabel = customBadge || "Destacado";
        const highlight =
          customText ||
          (spotsLeft !== null && spotsLeft <= 15
            ? `¡Solo quedan ${spotsLeft} cupos!`
            : this.formatDateSnippet(pinnedEvent.date, now));

        const result: EventSpotlightData = {
          id: pinnedEvent.id,
          title: pinnedEvent.title,
          slug: pinnedEvent.slug,
          date: pinnedEvent.date.toISOString(),
          endDate: pinnedEvent.endDate?.toISOString() ?? null,
          location: pinnedEvent.location,
          isVirtual: pinnedEvent.isVirtual,
          price: pinnedEvent.price,
          coverImage: pinnedEvent.coverImage,
          badge: {
            type: "pinned",
            label: badgeLabel,
            variant: "star",
          },
          highlightMessage: highlight,
          spotsLeft,
          attendeeCount,
          capacity: pinnedEvent.capacity,
        };

        await setCached(cacheKey, result, CACHE_TTL.eventSpotlight);
        return result;
      }
    }

    // 2. MODO AUTOMÁTICO (o fallback si el pinned no fue encontrado)
    // Traemos candidatos de eventos publicados futuros o del día de hoy
    const candidates = await db
      .select()
      .from(events)
      .where(and(eq(events.status, "published"), gte(events.date, new Date(now.getTime() - 24 * 60 * 60 * 1000))))
      .orderBy(asc(events.date))
      .limit(15);

    if (candidates.length === 0) {
      return null;
    }

    // Calcular métricas para cada candidato
    const candidatesWithMetrics = await Promise.all(
      candidates.map(async (ev) => {
        const attendeeCount = await this.getAttendeeCount(ev.id);
        const spotsLeft = ev.capacity ? Math.max(0, ev.capacity - attendeeCount) : null;
        const fillRate = ev.capacity && ev.capacity > 0 ? attendeeCount / ev.capacity : 0;
        const msUntil = ev.date.getTime() - now.getTime();
        const hoursUntil = msUntil / (1000 * 60 * 60);

        const isFewTickets = ev.capacity !== null && spotsLeft !== null && spotsLeft > 0 && (spotsLeft <= 15 || fillRate >= 0.8);
        const isUpcoming = hoursUntil >= 0 && hoursUntil <= 72;
        const isPopular = attendeeCount >= 3 || (ev.viewCount ?? 0) >= 15;

        return {
          event: ev,
          attendeeCount,
          spotsLeft,
          fillRate,
          hoursUntil,
          isFewTickets,
          isUpcoming,
          isPopular,
        };
      }),
    );

    // Selección según el criterio configurado
    let selected = candidatesWithMetrics[0];

    if (settings.eventBannerCriteria === "few_tickets") {
      const few = candidatesWithMetrics.filter((c) => c.isFewTickets);
      if (few.length > 0) {
        selected = few.sort((a, b) => (a.spotsLeft ?? 999) - (b.spotsLeft ?? 999))[0];
      }
    } else if (settings.eventBannerCriteria === "popular") {
      selected = [...candidatesWithMetrics].sort(
        (a, b) => b.attendeeCount + (b.event.viewCount ?? 0) * 0.2 - (a.attendeeCount + (a.event.viewCount ?? 0) * 0.2),
      )[0];
    } else if (settings.eventBannerCriteria === "upcoming") {
      const upcoming = candidatesWithMetrics.filter((c) => c.hoursUntil >= 0);
      if (upcoming.length > 0) {
        selected = upcoming.sort((a, b) => a.hoursUntil - b.hoursUntil)[0];
      }
    } else {
      // "auto": Jerarquía inteligente:
      // 1. Si hay un evento con pocos cupos, crea la mayor urgencia
      const few = candidatesWithMetrics.find((c) => c.isFewTickets);
      // 2. Si hay un evento en las próximas 48 horas
      const soon = candidatesWithMetrics.find((c) => c.hoursUntil >= 0 && c.hoursUntil <= 48);
      // 3. Evento más popular
      const pop = [...candidatesWithMetrics].sort((a, b) => b.attendeeCount - a.attendeeCount)[0];

      if (few) {
        selected = few;
      } else if (soon) {
        selected = soon;
      } else if (pop && pop.attendeeCount > 0) {
        selected = pop;
      }
    }

    // Asignar badge y mensaje según la condición ganadora
    let badgeType: EventSpotlightBadgeType = "upcoming";
    let badgeLabel = "Comienza pronto";
    let variant: "fire" | "clock" | "bolt" | "star" = "clock";
    let highlightMessage = this.formatDateSnippet(selected.event.date, now);

    if (selected.isFewTickets && selected.spotsLeft !== null) {
      badgeType = "few_tickets";
      badgeLabel = "Últimos cupos";
      variant = "bolt";
      highlightMessage = `¡Solo quedan ${selected.spotsLeft} entradas disponibles!`;
    } else if (selected.isPopular && selected.attendeeCount > 0) {
      badgeType = "popular";
      badgeLabel = "Más popular";
      variant = "fire";
      highlightMessage = `+${selected.attendeeCount} personas ya tienen su entrada`;
    } else if (selected.hoursUntil < 24 && selected.hoursUntil >= 0) {
      badgeType = "upcoming";
      badgeLabel = "¡Empieza hoy!";
      variant = "clock";
      highlightMessage = "Asegura tu lugar antes de que inicie";
    }

    // Sobreescritura opcional si el admin puso texto personalizado
    if (settings.eventBannerCustomBadge?.trim()) {
      badgeLabel = settings.eventBannerCustomBadge.trim();
    }
    if (settings.eventBannerCustomText?.trim()) {
      highlightMessage = settings.eventBannerCustomText.trim();
    }

    const result: EventSpotlightData = {
      id: selected.event.id,
      title: selected.event.title,
      slug: selected.event.slug,
      date: selected.event.date.toISOString(),
      endDate: selected.event.endDate?.toISOString() ?? null,
      location: selected.event.location,
      isVirtual: selected.event.isVirtual,
      price: selected.event.price,
      coverImage: selected.event.coverImage,
      badge: {
        type: badgeType,
        label: badgeLabel,
        variant,
      },
      highlightMessage,
      spotsLeft: selected.spotsLeft,
      attendeeCount: selected.attendeeCount,
      capacity: selected.event.capacity,
    };

    await setCached(cacheKey, result, CACHE_TTL.eventSpotlight);
    return result;
  }

  private static async getAttendeeCount(eventId: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(registrations)
      .where(and(eq(registrations.eventId, eventId), activeOccupyingStatus));

    return row?.count ?? 0;
  }

  private static formatDateSnippet(eventDate: Date, now: Date): string {
    const diffMs = eventDate.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 0) return "En curso";
    if (diffHours < 12) return `Inicia en ${Math.max(1, diffHours)} horas`;
    if (diffDays === 0) return "Inicia hoy";
    if (diffDays === 1) return "Inicia mañana";
    if (diffDays <= 7) return `Inicia en ${diffDays} días`;

    return new Intl.DateTimeFormat("es-PE", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(eventDate);
  }
}
