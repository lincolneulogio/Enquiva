import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ExportScope, SessionUser } from "./types";
import {
  resolveAdminScopeForUser,
  scopeEventConditionForOrgId,
  scopeDenyAllCondition,
} from "@/lib/organizations/admin-scope";

export async function requireUser() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");
    return session.user as SessionUser;
}

export function assertScopeAccess(user: SessionUser, scope: ExportScope) {
    const role = user.role ?? "member";
    if (scope === "admin" && !["admin", "super_admin"].includes(role)) {
        throw new Error("Forbidden");
    }

    if (scope === "organizer" && !["organizer", "super_admin"].includes(role)) {
        throw new Error("Forbidden");
    }
}

export async function getScopedEvent(user: SessionUser, scope: ExportScope, eventId?: string | null) {
    if (!eventId) return null;

    const [event] = await db
        .select({
            id: events.id,
            title: events.title,
            organizerId: events.organizerId,
        })
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

    if (!event) throw new Error("Evento no encontrado");

    if (scope === "organizer" && user.role !== "super_admin" && event.organizerId !== user.id) {
        throw new Error("No autorizado para exportar este evento");
    }

    if (scope === "admin" && user.role === "admin") {
        const adminScope = await resolveAdminScopeForUser(user.id, user.role);
        if (adminScope.mode === "unassigned") {
            throw new Error("Configura tu entidad antes de exportar datos");
        }
        if (adminScope.mode === "org") {
            const [eventOrg] = await db
              .select({ organizationId: events.organizationId })
              .from(events)
              .where(eq(events.id, eventId))
              .limit(1);
            if (eventOrg?.organizationId !== adminScope.organizationId) {
              throw new Error("No autorizado para exportar este evento");
            }
        }
    }

    return event;
}

export async function getAdminOrgEventFilter(user: SessionUser) {
    if (user.role !== "admin") return undefined;
    const scope = await resolveAdminScopeForUser(user.id, user.role);
    if (scope.mode === "unassigned") return scopeDenyAllCondition();
    if (scope.mode === "org") {
        return scopeEventConditionForOrgId(scope.organizationId);
    }
    return undefined;
}

export function buildFileName(parts: Array<string | null | undefined>) {
    return parts
        .filter(Boolean)
        .join("-")
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/gi, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

export function normalizeFilterValue(value?: string | null) {
    if (!value || value === "all") return null;
    return value;
}

export function parseFromDate(value?: string | null) {
    if (!value) return null;
    return new Date(`${value}T00:00:00.000`);
}

export function parseToDate(value?: string | null) {
    if (!value) return null;
    return new Date(`${value}T23:59:59.999`);
}

export function formatDateRangeLabel(locale: string, fromDate?: string | null, toDate?: string | null) {
    if (!fromDate && !toDate) return null;

    const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-PE", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    if (fromDate && toDate) {
        return `${formatter.format(parseFromDate(fromDate)!)} → ${formatter.format(parseToDate(toDate)!)} `;
    }

    if (fromDate) {
        return locale === "en"
            ? `From ${formatter.format(parseFromDate(fromDate)!)} `
            : `Desde ${formatter.format(parseFromDate(fromDate)!)} `;
    }

    return locale === "en"
        ? `Until ${formatter.format(parseToDate(toDate)!)} `
        : `Hasta ${formatter.format(parseToDate(toDate)!)} `;
}
