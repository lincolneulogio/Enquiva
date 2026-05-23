import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, registrations, users } from "@/lib/db/schema";
import { getI18n } from "@/lib/i18n/server";
import { categoryLabel, eventStatusLabel, formatEventDateShort } from "@/lib/utils";
import type { ExportFilters, ExportPayload, ExportScope, SessionUser } from "./types";
import {
    buildFileName,
    formatDateRangeLabel,
    getScopedEvent,
    normalizeFilterValue,
    parseFromDate,
    parseToDate,
} from "./helpers";

export async function exportEventsData(
    user: SessionUser,
    scope: ExportScope,
    filters: ExportFilters
): Promise<ExportPayload> {
    const { locale, t } = await getI18n();
    const eventId = normalizeFilterValue(filters.eventId);
    const status = normalizeFilterValue(filters.status);
    const category = normalizeFilterValue(filters.category);
    const fromDate = parseFromDate(filters.fromDate);
    const toDate = parseToDate(filters.toDate);
    const scopedEvent = await getScopedEvent(user, scope, eventId);

    const conditions = [];
    if (scope === "organizer" && user.role !== "super_admin") {
        conditions.push(eq(events.organizerId, user.id));
    }
    if (eventId) {
        conditions.push(eq(events.id, eventId));
    }
    if (status) {
        conditions.push(eq(events.status, status as "draft" | "published" | "cancelled" | "completed"));
    }
    if (category) {
        conditions.push(eq(events.category, category));
    }
    if (fromDate) {
        conditions.push(gte(events.date, fromDate));
    }
    if (toDate) {
        conditions.push(lte(events.date, toDate));
    }

    const rows = await db
        .select({
            id: events.id,
            title: events.title,
            organizerName: users.name,
            category: events.category,
            date: events.date,
            status: events.status,
            capacity: events.capacity,
            location: events.location,
            virtualLink: events.virtualLink,
            isVirtual: events.isVirtual,
            attendeeCount: count(registrations.id),
        })
        .from(events)
        .innerJoin(users, eq(events.organizerId, users.id))
        .leftJoin(
            registrations,
            and(eq(registrations.eventId, events.id), eq(registrations.status, "registered"))
        )
        .where(conditions.length ? and(...conditions) : undefined)
        .groupBy(events.id, users.name)
        .orderBy(desc(events.date));

    return {
        title: t("dashboard.admin.allEvents"),
        subtitle: scopedEvent ? `${t("common.event")}: ${scopedEvent.title}` : undefined,
        suggestedFileName: buildFileName([
            scope,
            "eventos",
            scopedEvent?.title,
            category,
            status ?? "todos",
            filters.fromDate,
            filters.toDate,
            new Date().toISOString().slice(0, 10),
        ]),
        generatedAt: new Date().toISOString(),
        columns: [
            { key: "title", label: t("dashboard.admin.title") },
            { key: "organizer", label: t("common.organizer") },
            { key: "category", label: t("common.category") },
            { key: "date", label: t("common.date") },
            { key: "status", label: t("common.status") },
            { key: "modality", label: locale === "en" ? "Modality" : "Modalidad" },
            { key: "attendees", label: locale === "en" ? "Attendees" : "Asistentes" },
            { key: "capacity", label: t("events.form.capacity") },
            { key: "location", label: locale === "en" ? "Location / Link" : "Ubicación / enlace" },
        ],
        rows: rows.map((row) => ({
            title: row.title,
            organizer: row.organizerName,
            category: categoryLabel(row.category, locale),
            date: formatEventDateShort(row.date, locale),
            status: eventStatusLabel(row.status, locale),
            modality: row.isVirtual ? t("events.form.virtualEvent") : (locale === "en" ? "In person" : "Presencial"),
            attendees: Number(row.attendeeCount),
            capacity: row.capacity ?? (locale === "en" ? "Unlimited" : "Ilimitada"),
            location: row.isVirtual ? row.virtualLink ?? "—" : row.location ?? "—",
        })),
        summary: [
            { label: locale === "en" ? "Total events" : "Total de eventos", value: rows.length },
            ...(status
                ? [{ label: locale === "en" ? "Status" : "Estado", value: eventStatusLabel(status, locale) }]
                : []),
            ...(category
                ? [{ label: t("common.category"), value: categoryLabel(category, locale) }]
                : []),
            ...(filters.fromDate || filters.toDate
                ? [{ label: locale === "en" ? "Period" : "Periodo", value: formatDateRangeLabel(locale, filters.fromDate, filters.toDate) ?? "—" }]
                : []),
        ],
    };
}
