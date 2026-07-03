import Link from "next/link";
import { db } from "@/lib/db";
import { registrations, events, users, payments, transportBookings, transportRoutes } from "@/lib/db/schema";
import { eq, desc, count, and, gte, lte, sql, inArray, type SQL } from "drizzle-orm";
import { ClipboardList, Bus, CreditCard } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";
import { categoryLabel, registrationStatusLabel, formatCurrency } from "@/lib/utils";
import { TablePagination } from "@/components/dashboard";
import { ExportDataPanel } from "@/components/dashboard";
import { getExportEventOptions } from "@/actions/exports";
import { getCategories } from "@/actions/events";
import { Suspense } from "react";
import { resolveAdminScope, scopeEventCondition } from "@/lib/organizations/admin-scope";

interface AdminRegistrationsPageProps {
  searchParams: Promise<{
    page?: string;
    eventId?: string;
    category?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }>;
}

const PAGE_SIZE = 10;

const statusColor: Record<string, string> = {
  registered: "bg-green-100 text-green-900 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30",
  waitlisted: "bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30",
  checked_in: "bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/30",
  cancelled: "bg-red-100 text-red-900 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30",
};

export default async function AdminRegistrationsPage({ searchParams }: AdminRegistrationsPageProps) {
  const { locale, t } = await getI18n();
  const params = await searchParams;
  const requestedPage = Number(params.page ?? "1");
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  const exportEventOptions = await getExportEventOptions("admin");
  const exportCategoryOptions = (await getCategories()).map((category) => ({
    value: category.slug,
    label: categoryLabel(category.slug, locale),
  }));
  const exportStatusOptions = ["all", "registered", "checked_in", "waitlisted", "cancelled"].map((value) => ({
    value,
    label: value === "all" ? t("common.all") : registrationStatusLabel(value, locale),
  }));

  const adminScope = await resolveAdminScope();
  const orgEventFilter = scopeEventCondition(adminScope);

  // Build filter conditions
  const conditions: SQL[] = [];
  if (orgEventFilter) {
    conditions.push(orgEventFilter);
  }
  if (params.eventId) {
    conditions.push(eq(events.id, params.eventId));
  }
  if (params.category) {
    conditions.push(eq(events.category, params.category));
  }
  if (params.status && params.status !== "all") {
    conditions.push(eq(registrations.status, params.status as any));
  }
  if (params.fromDate) {
    conditions.push(gte(registrations.registeredAt, new Date(`${params.fromDate}T00:00:00.000`)));
  }
  if (params.toDate) {
    conditions.push(lte(registrations.registeredAt, new Date(`${params.toDate}T23:59:59.999`)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(users, eq(registrations.userId, users.id))
    .where(whereClause);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;
  const rowStart = offset;

  const allRegistrations = await db
    .select({
      id: registrations.id,
      status: registrations.status,
      registeredAt: registrations.registeredAt,
      checkedInAt: registrations.checkedInAt,
      event: {
        id: events.id,
        title: events.title,
        slug: events.slug,
        date: events.date,
      },
      attendee: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(users, eq(registrations.userId, users.id))
    .where(whereClause)
    .orderBy(desc(registrations.registeredAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  // Fetch parent registrants / inviters for guests on the current page
  const guestRegs = allRegistrations.filter((r) => r.attendee.email?.startsWith("guest_"));
  const guestIds = guestRegs.map((r) => r.id);
  const invitersMap = new Map<string, { name: string | null; email: string }>();
  const guestToParentRegIdMap = new Map<string, string>();

  if (guestIds.length > 0) {
    try {
      const parentRegistrations = await db
        .select({
          id: registrations.id,
          notes: registrations.notes,
          inviterName: users.name,
          inviterEmail: users.email,
        })
        .from(registrations)
        .innerJoin(users, eq(registrations.userId, users.id))
        .where(
          and(
            eq(registrations.eventId, allRegistrations[0].event.id),
            sql`${registrations.notes} IS NOT NULL`
          )
        );

      for (const parent of parentRegistrations) {
        if (parent.notes && parent.notes.startsWith("[GUESTS:")) {
          for (const gId of guestIds) {
            if (parent.notes.includes(gId)) {
              invitersMap.set(gId, {
                name: parent.inviterName,
                email: parent.inviterEmail,
              });
              guestToParentRegIdMap.set(gId, parent.id);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to load inviters map:", err);
    }
  }

  const currentRegIds = allRegistrations.map((r) => r.id);
  const parentRegIds = Array.from(guestToParentRegIdMap.values());
  const allLookupIds = Array.from(new Set([...currentRegIds, ...parentRegIds]));

  const paymentsMap = new Map<string, { amount: string; status: string; method: string; currency: string }>();
  const transportMap = new Map<string, { seats: number; routeName: string | null; totalSeats: number | null }>();

  if (allLookupIds.length > 0) {
    const paymentsList = await db
      .select({
        registrationId: payments.registrationId,
        amount: payments.amount,
        status: payments.status,
        method: payments.method,
        currency: payments.currency,
      })
      .from(payments)
      .where(inArray(payments.registrationId, allLookupIds))
      .orderBy(desc(payments.createdAt));

    for (const p of paymentsList) {
      if (p.registrationId && !paymentsMap.has(p.registrationId)) {
        paymentsMap.set(p.registrationId, p);
      }
    }

    const bookingsList = await db
      .select({
        registrationId: transportBookings.registrationId,
        seats: transportBookings.seats,
        routeName: transportRoutes.name,
        totalSeats: transportRoutes.totalSeats,
      })
      .from(transportBookings)
      .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
      .where(inArray(transportBookings.registrationId, allLookupIds));

    for (const b of bookingsList) {
      if (b.registrationId) {
        transportMap.set(b.registrationId, {
          seats: b.seats,
          routeName: b.routeName,
          totalSeats: b.totalSeats,
        });
      }
    }
  }

  const isFiltered = !!(params.eventId || params.category || (params.status && params.status !== "all") || params.fromDate || params.toDate);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.registrations")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("dashboard.admin.registrationsIntro", {
            count: total,
            label: total === 1 ? (locale === "en" ? "registration" : "inscripción") : (locale === "en" ? "registrations" : "inscripciones"),
          })}
          {isFiltered && (
            <span className="ml-2 text-xs text-primary font-medium">({locale === "en" ? "filtered" : "filtrado"})</span>
          )}
        </p>
      </div>

      <Suspense>
        <ExportDataPanel
          resource="registrations"
          scope="admin"
          eventOptions={exportEventOptions}
          categoryOptions={exportCategoryOptions}
          statusOptions={exportStatusOptions}
        />
      </Suspense>

      {allRegistrations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 font-medium text-foreground">{t("dashboard.admin.noRegistrationsYet")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFiltered
              ? (locale === "en" ? "No registrations match your filters." : "Ninguna inscripción coincide con los filtros.")
              : t("dashboard.admin.registrationsAppearHere")}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border bg-muted/10">
            <span className="text-xs font-semibold text-foreground flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              {locale === "en" ? "Registrations Directory" : "Directorio de Inscripciones"}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-medium">
              ↔ {locale === "en" ? "Scroll horizontally to view all columns" : "Desliza horizontalmente para ver todas las columnas"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1480px] table-fixed text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[60px]">N°</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[240px]">{t("common.attendee")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[240px]">{t("common.event")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[160px]">{locale === "en" ? "Type / Invited By" : "Tipo / Invitado Por"}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[160px]">{locale === "en" ? "Payment" : "Pago"}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[240px]">{locale === "en" ? "Transport" : "Transporte"}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[140px]">{t("common.status")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[135px]">{t("common.registered")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[135px]">{t("common.checkedIn")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allRegistrations.map((reg, index) => {
                  const parentRegId = guestToParentRegIdMap.get(reg.id);
                  const payment = paymentsMap.get(reg.id) || (parentRegId ? paymentsMap.get(parentRegId) : undefined);
                  const transport = transportMap.get(reg.id) || (parentRegId ? transportMap.get(parentRegId) : undefined);
                  return (
                    <tr key={reg.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4 text-muted-foreground">{rowStart + index + 1}</td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-foreground">{reg.attendee.name}</p>
                        <p className="text-xs text-muted-foreground">{reg.attendee.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/events/${reg.event.slug}`}
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {reg.event.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {new Date(reg.event.date).toLocaleDateString(getIntlLocale(locale), {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {reg.attendee.email?.startsWith("guest_") ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              {locale === "en" ? "Guest" : "Invitado"}
                            </span>
                            {invitersMap.get(reg.id) && (
                              <p className="text-[11px] text-muted-foreground leading-none">
                                {locale === "en" ? "by " : "de "}<span className="font-medium text-foreground">{invitersMap.get(reg.id)!.name}</span>
                              </p>
                            )}
                          </div>
                        ) : reg.attendee.email?.startsWith("offline_") ? (
                          <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                            {locale === "en" ? "Manual Reg" : "Reg. Manual"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            {locale === "en" ? "Primary" : "Titular"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {payment ? (
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">
                              {formatCurrency(Number(payment.amount), payment.currency, locale)}
                            </p>
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[9px] text-muted-foreground uppercase bg-secondary px-1 py-0.5 rounded font-medium">
                                {payment.method}
                              </span>
                              <span className={`text-[9px] px-1 py-0.5 rounded font-semibold border ${
                                payment.status === "approved"
                                  ? "bg-green-500/10 text-green-700 border-green-500/20"
                                  : payment.status === "pending"
                                    ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                                    : "bg-red-500/10 text-red-700 border-red-500/20"
                              }`}>
                                {payment.status === "approved" 
                                  ? (locale === "en" ? "Paid" : "Pagado")
                                  : payment.status === "pending"
                                    ? (locale === "en" ? "Pending" : "Pendiente")
                                    : (locale === "en" ? "Rejected" : "Rechazado")
                                }
                              </span>
                              {parentRegId && paymentsMap.get(reg.id) === undefined && (
                                <span className="text-[9px] text-muted-foreground/80 block italic">
                                  {locale === "en" ? "(via sponsor)" : "(vía titular)"}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/55 italic">
                            {locale === "en" ? "No payment" : "Sin pago"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {transport ? (
                          <div className="space-y-1">
                            <p className="font-medium text-foreground text-xs truncate max-w-[220px]" title={transport.routeName ?? ""}>
                              {transport.routeName ?? (locale === "en" ? "Booked" : "Reservado")}
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-none flex items-center gap-1">
                              <Bus className="h-3 w-3 text-primary shrink-0" />
                              {locale === "en" ? (
                                <>
                                  {transport.seats} {transport.seats === 1 ? "seat booked" : "seats booked"}{" "}
                                  of {transport.totalSeats ?? 0} available
                                  {parentRegId && transportMap.get(reg.id) === undefined && (
                                    <span className="text-[9px] text-muted-foreground/80 block italic mt-0.5">
                                      (via sponsor)
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  {transport.seats} {transport.seats === 1 ? "asiento ocupado" : "asientos ocupados"}{" "}
                                  de {transport.totalSeats ?? 0} disponibles
                                  {parentRegId && transportMap.get(reg.id) === undefined && (
                                    <span className="text-[9px] text-muted-foreground/80 block italic mt-0.5">
                                      (vía titular)
                                    </span>
                                  )}
                                </>
                              )}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/55 italic">
                            {locale === "en" ? "No transport" : "Sin transporte"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[reg.status] ?? "bg-secondary text-foreground"}`}
                        >
                          {registrationStatusLabel(reg.status, locale)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {new Date(reg.registeredAt).toLocaleDateString(getIntlLocale(locale), {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {reg.checkedInAt
                          ? new Date(reg.checkedInAt).toLocaleDateString(getIntlLocale(locale), {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                          : <span className="text-muted-foreground/40">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <TablePagination
            basePath="/admin/registrations"
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={total}
            pageSize={PAGE_SIZE}
            query={{
              eventId: params.eventId,
              category: params.category,
              status: params.status,
              fromDate: params.fromDate,
              toDate: params.toDate,
            }}
          />
        </div>
      )}
    </div>
  );
}
