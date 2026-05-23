"use server";

import { headers } from "next/headers";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
    events,
    payments,
    registrations,
    transportBookings,
    transportRoutes,
    users,
} from "@/lib/db/schema";
import { getI18n } from "@/lib/i18n/server";
import { getPaymentStatusLabel } from "@/lib/i18n/core";
import { categoryLabel, eventStatusLabel, formatCurrency, formatEventDateShort, registrationStatusLabel } from "@/lib/utils";
import type { AppRole } from "@/lib/auth/rbac";

export type ExportScope = "admin" | "organizer";
export type ExportResource = "events" | "registrations" | "payments";

export interface ExportEventOption {
    id: string;
    title: string;
}

export interface ExportColumn {
    key: string;
    label: string;
}

export interface ExportCategoryOption {
    value: string;
    label: string;
}

export interface ExportPayload {
    title: string;
    subtitle?: string;
    suggestedFileName: string;
    generatedAt: string;
    columns: ExportColumn[];
    rows: Array<Record<string, string | number | null>>;
    summary: Array<{ label: string; value: string | number }>;
}

const exportSchema = z.object({
    resource: z.enum(["events", "registrations", "payments"]),
    scope: z.enum(["admin", "organizer"]),
    eventId: z.string().uuid().optional().nullable(),
    status: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

type SessionUser = {
    id: string;
    role?: string | null;
};

async function requireUser() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");
    return session.user as SessionUser;
}

function assertScopeAccess(user: SessionUser, scope: ExportScope) {
    const role = user.role ?? "member";
    if (scope === "admin" && !["admin", "super_admin"].includes(role)) {
        throw new Error("Forbidden");
    }

    if (scope === "organizer" && !["organizer", "super_admin"].includes(role)) {
        throw new Error("Forbidden");
    }
}

async function getScopedEvent(user: SessionUser, scope: ExportScope, eventId?: string | null) {
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

    return event;
}

function buildFileName(parts: Array<string | null | undefined>) {
    return parts
        .filter(Boolean)
        .join("-")
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/gi, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function normalizeFilterValue(value?: string | null) {
    if (!value || value === "all") return null;
    return value;
}

function parseFromDate(value?: string | null) {
    if (!value) return null;
    return new Date(`${value}T00:00:00.000`);
}

function parseToDate(value?: string | null) {
    if (!value) return null;
    return new Date(`${value}T23:59:59.999`);
}

function formatDateRangeLabel(locale: string, fromDate?: string | null, toDate?: string | null) {
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

type ExportFilters = Pick<z.infer<typeof exportSchema>, "eventId" | "status" | "category" | "fromDate" | "toDate">;

export async function getExportEventOptions(scope: ExportScope): Promise<ExportEventOption[]> {
    const user = await requireUser();
    assertScopeAccess(user, scope);

    const rows = await db
        .select({ id: events.id, title: events.title })
        .from(events)
        .where(
            scope === "organizer" && user.role !== "super_admin"
                ? eq(events.organizerId, user.id)
                : undefined
        )
        .orderBy(desc(events.date));

    return rows;
}

async function exportEventsData(user: SessionUser, scope: ExportScope, filters: ExportFilters): Promise<ExportPayload> {
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

async function exportRegistrationsData(user: SessionUser, scope: ExportScope, filters: ExportFilters): Promise<ExportPayload> {
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

async function exportPaymentsData(user: SessionUser, scope: ExportScope, filters: ExportFilters): Promise<ExportPayload> {
    const { locale, t } = await getI18n();
    const eventId = normalizeFilterValue(filters.eventId);
    const status = normalizeFilterValue(filters.status);
    const category = normalizeFilterValue(filters.category);
    const fromDate = parseFromDate(filters.fromDate);
    const toDate = parseToDate(filters.toDate);
    const scopedEvent = await getScopedEvent(user, scope, eventId);

    const conditions = [];
    if (eventId) {
        conditions.push(eq(events.id, eventId));
    }
    if (scope === "organizer" && user.role !== "super_admin") {
        conditions.push(eq(events.organizerId, user.id));
    }
    if (status) {
        conditions.push(eq(payments.status, status as "pending" | "approved" | "rejected"));
    }
    if (category) {
        conditions.push(eq(events.category, category));
    }
    if (fromDate) {
        conditions.push(gte(payments.createdAt, fromDate));
    }
    if (toDate) {
        conditions.push(lte(payments.createdAt, toDate));
    }

    const rows = await db
        .select({
            id: payments.id,
            createdAt: payments.createdAt,
            amount: payments.amount,
            currency: payments.currency,
            method: payments.method,
            status: payments.status,
            reference: payments.reference,
            receiptUrl: payments.receiptUrl,
            attendeeName: users.name,
            attendeeEmail: users.email,
            eventTitle: events.title,
            routeName: transportRoutes.name,
        })
        .from(payments)
        .innerJoin(registrations, eq(payments.registrationId, registrations.id))
        .innerJoin(events, eq(registrations.eventId, events.id))
        .innerJoin(users, eq(payments.userId, users.id))
        .leftJoin(transportBookings, eq(transportBookings.id, payments.transportBookingId))
        .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(payments.createdAt));

    const totalAmount = rows.reduce((sum, row) => sum + Number(row.amount), 0);

    return {
        title: t("common.payments"),
        subtitle: scopedEvent ? `${t("common.event")}: ${scopedEvent.title}` : undefined,
        suggestedFileName: buildFileName([
            scope,
            "pagos",
            scopedEvent?.title,
            category,
            status,
            filters.fromDate,
            filters.toDate,
            new Date().toISOString().slice(0, 10),
        ]),
        generatedAt: new Date().toISOString(),
        columns: [
            { key: "date", label: t("common.date") },
            { key: "event", label: t("common.event") },
            { key: "route", label: t("common.route") },
            { key: "attendee", label: t("common.attendee") },
            { key: "email", label: t("common.email") },
            { key: "amount", label: t("common.amount") },
            { key: "method", label: t("common.method") },
            { key: "status", label: t("common.status") },
            { key: "reference", label: locale === "en" ? "Reference" : "Referencia" },
            { key: "receipt", label: t("common.receipt") },
        ],
        rows: rows.map((row) => ({
            date: formatEventDateShort(row.createdAt, locale),
            event: row.eventTitle,
            route: row.routeName ?? t("common.noDataDash"),
            attendee: row.attendeeName ?? t("common.guest"),
            email: row.attendeeEmail,
            amount: formatCurrency(Number(row.amount), row.currency, locale),
            method: row.method,
            status: getPaymentStatusLabel(row.status, locale),
            reference: row.reference ?? "—",
            receipt: row.receiptUrl ? (locale === "en" ? "Available" : "Disponible") : t("common.noReceipt"),
        })),
        summary: [
            { label: locale === "en" ? "Total payments" : "Total de pagos", value: rows.length },
            { label: locale === "en" ? "Total amount" : "Monto total", value: formatCurrency(totalAmount, "PEN", locale) },
            ...(status
                ? [{ label: locale === "en" ? "Status" : "Estado", value: getPaymentStatusLabel(status, locale) }]
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

export async function getExportData(input: z.infer<typeof exportSchema>): Promise<ExportPayload> {
    const user = await requireUser();
    const validated = exportSchema.parse(input);

    assertScopeAccess(user, validated.scope);

    switch (validated.resource) {
        case "events":
            return exportEventsData(user, validated.scope, validated);
        case "registrations":
            return exportRegistrationsData(user, validated.scope, validated);
        case "payments":
            return exportPaymentsData(user, validated.scope, validated);
        default:
            throw new Error("Tipo de exportación no soportado");
    }
}
