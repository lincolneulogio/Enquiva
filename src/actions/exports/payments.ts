import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
    events,
    registrations,
    users,
    payments,
    transportBookings,
    transportRoutes,
} from "@/lib/db/schema";
import { getI18n } from "@/lib/i18n/server";
import { getPaymentStatusLabel } from "@/lib/i18n/core";
import { categoryLabel, formatCurrency, formatEventDateShort } from "@/lib/utils";
import type { ExportFilters, ExportPayload, ExportScope, SessionUser } from "./types";
import { calculateEarnings, roundMoney } from "@/lib/payments/earnings-report";
import {
    buildFileName,
    formatDateRangeLabel,
    getScopedEvent,
    getAdminOrgEventFilter,
    normalizeFilterValue,
    parseFromDate,
    parseToDate,
} from "./helpers";

export async function exportPaymentsData(
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
        conditions.push(eq(events.id, eventId));
    }
    if (scope === "organizer" && user.role !== "super_admin") {
        conditions.push(eq(events.organizerId, user.id));
    }
    if (scope === "admin") {
        const orgFilter = await getAdminOrgEventFilter(user);
        if (orgFilter) conditions.push(orgFilter);
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
            platformFee: payments.platformFee,
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

    const summariesByCurrency = new Map<
        string,
        { approvedGross: number; commission: number; net: number; pending: number; unsettled: number }
    >();
    for (const row of rows) {
        const current = summariesByCurrency.get(row.currency) ?? {
            approvedGross: 0,
            commission: 0,
            net: 0,
            pending: 0,
            unsettled: 0,
        };
        const amount = Number(row.amount);
        if (row.status === "approved") {
            const earnings = calculateEarnings({
                approvedGross: amount,
                platformCommission: Number(row.platformFee ?? 0),
            });
            current.approvedGross = roundMoney(current.approvedGross + earnings.approvedGross);
            current.commission = roundMoney(current.commission + earnings.platformCommission);
            current.net = roundMoney(current.net + earnings.organizerNet);
            if (row.platformFee == null) current.unsettled += 1;
        } else if (row.status === "pending") {
            current.pending = roundMoney(current.pending + amount);
        }
        summariesByCurrency.set(row.currency, current);
    }

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
            { key: "commission", label: t("payments.earnings.commission") },
            { key: "net", label: t("payments.earnings.net") },
            { key: "method", label: t("common.method") },
            { key: "status", label: t("common.status") },
            { key: "reference", label: locale === "en" ? "Reference" : "Referencia" },
            { key: "receipt", label: t("common.receipt") },
        ],
        rows: rows.map((row) => {
            const approved = row.status === "approved";
            const earnings = calculateEarnings({
                approvedGross: approved ? Number(row.amount) : 0,
                platformCommission: approved ? Number(row.platformFee ?? 0) : 0,
            });
            return {
                date: formatEventDateShort(row.createdAt, locale),
                event: row.eventTitle,
                route: row.routeName ?? t("common.noDataDash"),
                attendee: row.attendeeName ?? t("common.guest"),
                email: row.attendeeEmail,
                amount: formatCurrency(Number(row.amount), row.currency, locale),
                commission: approved
                    ? row.platformFee == null
                        ? locale === "en" ? "Unreconciled" : "Sin conciliar"
                        : formatCurrency(earnings.platformCommission, row.currency, locale)
                    : "—",
                net: approved
                    ? formatCurrency(earnings.organizerNet, row.currency, locale)
                    : "—",
                method: row.method,
                status: getPaymentStatusLabel(row.status, locale),
                reference: row.reference ?? "—",
                receipt: row.receiptUrl ? (locale === "en" ? "Available" : "Disponible") : t("common.noReceipt"),
            };
        }),
        summary: [
            { label: locale === "en" ? "Total payments" : "Total de pagos", value: rows.length },
            ...[...summariesByCurrency.entries()].flatMap(([currency, summary]) => [
                { label: `${t("payments.earnings.gross")} (${currency})`, value: formatCurrency(summary.approvedGross, currency, locale) },
                { label: `${t("payments.earnings.commission")} (${currency})`, value: formatCurrency(summary.commission, currency, locale) },
                { label: `${t("payments.earnings.net")} (${currency})`, value: formatCurrency(summary.net, currency, locale) },
                { label: `${t("payments.earnings.pending")} (${currency})`, value: formatCurrency(summary.pending, currency, locale) },
                ...(summary.unsettled > 0
                    ? [{ label: locale === "en" ? "Unreconciled approved payments" : "Pagos aprobados sin conciliar", value: summary.unsettled }]
                    : []),
            ]),
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
