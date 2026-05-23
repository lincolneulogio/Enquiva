import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, registrations, users } from "@/lib/db/schema";
import { getI18n } from "@/lib/i18n/server";
import { categoryLabel, registrationStatusLabel, formatEventDateShort } from "@/lib/utils";
import type { ExportFilters, ExportPayload, ExportScope, SessionUser } from "./types";
import {
    buildFileName,
    formatDateRangeLabel,
    getScopedEvent,
    normalizeFilterValue,
    parseFromDate,
    parseToDate,
} from "./helpers";

export async function exportRegistrationsData(
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
    if (eventId) {
        conditions.push(eq(registrations.eventId, eventId));
    }
    if (scope === "organizer" && user.role !== "super_admin") {
        conditions.push(eq(events.organizerId, user.id));
    }
    if (status) {
        conditions.push(eq(registrations.status, status as "registered" | "checked_in" | "waitlisted" | "cancelled"));
    }
    if (category) {
        conditions.push(eq(events.category, category));
    }
    if (fromDate) {
        conditions.push(gte(registrations.registeredAt, fromDate));
    }
    if (toDate) {
        conditions.push(lte(registrations.registeredAt, toDate));
    }

    const rows = await db
        .select({
            id: registrations.id,
            status: registrations.status,
            registeredAt: registrations.registeredAt,
            checkedInAt: registrations.checkedInAt,
            contactPhone: registrations.contactPhone,
            attendeeName: users.name,
            attendeeEmail: users.email,
            eventTitle: events.title,
            eventDate: events.date,
        })
        .from(registrations)
        .innerJoin(events, eq(registrations.eventId, events.id))
        .innerJoin(users, eq(registrations.userId, users.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(registrations.registeredAt));

    return {
        title: t("common.registrations"),
        subtitle: scopedEvent ? `${t("common.event")}: ${scopedEvent.title}` : undefined,
        suggestedFileName: buildFileName([
            scope,
            "inscripciones",
            scopedEvent?.title,
            category,
            status,
            filters.fromDate,
            filters.toDate,
            new Date().toISOString().slice(0, 10),
        ]),
        generatedAt: new Date().toISOString(),
        columns: [
            { key: "attendee", label: t("common.attendee") },
            { key: "email", label: t("common.email") },
            { key: "phone", label: locale === "en" ? "Phone" : "Teléfono" },
            { key: "event", label: t("common.event") },
            { key: "eventDate", label: locale === "en" ? "Event date" : "Fecha del evento" },
            { key: "status", label: t("common.status") },
            { key: "registeredAt", label: t("common.registered") },
            { key: "checkedInAt", label: t("common.checkedIn") },
        ],
        rows: rows.map((row) => ({
            attendee: row.attendeeName,
            email: row.attendeeEmail,
            phone: row.contactPhone ?? "—",
            event: row.eventTitle,
            eventDate: formatEventDateShort(row.eventDate, locale),
            status: registrationStatusLabel(row.status, locale),
            registeredAt: formatEventDateShort(row.registeredAt, locale),
            checkedInAt: row.checkedInAt ? formatEventDateShort(row.checkedInAt, locale) : "—",
        })),
        summary: [
            { label: locale === "en" ? "Total registrations" : "Total de inscripciones", value: rows.length },
            { label: locale === "en" ? "Checked in" : "Con check-in", value: rows.filter((row) => row.checkedInAt).length },
            ...(status
                ? [{ label: locale === "en" ? "Status" : "Estado", value: registrationStatusLabel(status, locale) }]
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
