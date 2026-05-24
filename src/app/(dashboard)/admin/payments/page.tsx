import Link from "next/link";
import { db } from "@/lib/db";
import { payments, registrations, events, users, transportBookings, transportRoutes } from "@/lib/db/schema";
import { eq, desc, and, gte, lte, count, type SQL } from "drizzle-orm";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { PaymentStatusSelect } from "@/components/payments/PaymentStatusSelect";
import { formatCurrency } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale, getPaymentStatusLabel } from "@/lib/i18n/core";
import { TablePagination } from "@/components/dashboard";
import { ExportDataPanel } from "@/components/dashboard";
import { getExportEventOptions } from "@/actions/exports";
import { getCategories } from "@/actions/events";
import { categoryLabel } from "@/lib/utils";
import { Suspense } from "react";
import { PaymentNotesButton } from "@/components/payments/PaymentNotesButton";

interface AdminPaymentsPageProps {
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

export default async function AdminPaymentsPage({ searchParams }: AdminPaymentsPageProps) {
  const { locale, t } = await getI18n();
  const params = await searchParams;
  const exportEventOptions = await getExportEventOptions("admin");
  const exportCategoryOptions = (await getCategories()).map((category) => ({
    value: category.slug,
    label: categoryLabel(category.slug, locale),
  }));
  const exportStatusOptions = ["all", "pending", "approved", "rejected"].map((value) => ({
    value,
    label: value === "all" ? t("common.all") : getPaymentStatusLabel(value, locale),
  }));

  const requestedPage = Number(params.page ?? "1");
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  // Build filter conditions
  const conditions: SQL[] = [];
  if (params.eventId) {
    conditions.push(eq(events.id, params.eventId));
  }
  if (params.category) {
    conditions.push(eq(events.category, params.category));
  }
  if (params.status && params.status !== "all") {
    conditions.push(eq(payments.status, params.status as any));
  }
  if (params.fromDate) {
    conditions.push(gte(payments.createdAt, new Date(`${params.fromDate}T00:00:00.000`)));
  }
  if (params.toDate) {
    conditions.push(lte(payments.createdAt, new Date(`${params.toDate}T23:59:59.999`)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(payments)
    .innerJoin(registrations, eq(payments.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(users, eq(payments.userId, users.id))
    .where(whereClause);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;
  const rowStart = offset;

  const allPayments = await db
    .select({
      payment: payments,
      registration: registrations,
      event: events,
      attendee: users,
      transportBooking: transportBookings,
      transportRoute: transportRoutes,
    })
    .from(payments)
    .innerJoin(registrations, eq(payments.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(users, eq(payments.userId, users.id))
    .leftJoin(transportBookings, eq(transportBookings.id, payments.transportBookingId))
    .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
    .where(whereClause)
    .orderBy(desc(payments.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const isFiltered = !!(params.eventId || params.category || (params.status && params.status !== "all") || params.fromDate || params.toDate);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.payments")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("dashboard.admin.paymentsIntro")}
          {isFiltered && (
            <span className="ml-2 text-xs text-primary font-medium">({locale === "en" ? "filtered" : "filtrado"})</span>
          )}
        </p>
      </div>

      <Suspense>
        <ExportDataPanel
          resource="payments"
          scope="admin"
          eventOptions={exportEventOptions}
          categoryOptions={exportCategoryOptions}
          statusOptions={exportStatusOptions}
        />
      </Suspense>

      <div className="rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{t("dashboard.admin.showingPayments", { count: total })}</span>
          </div>
        </div>
        {allPayments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-medium text-foreground">{t("dashboard.member.noPaymentsYet")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isFiltered
                ? (locale === "en" ? "No payments match your filters." : "Ningún pago coincide con los filtros.")
                : (locale === "en" ? "Payments will appear here when made." : "Los pagos aparecerán aquí cuando se realicen.")}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <p className="px-3 pt-2 text-[11px] text-muted-foreground sm:hidden">↔ Scroll</p>
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">N°</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.payments")}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.event")}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.route")}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.attendee")}</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t("common.amount")}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.method")}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.status")}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.update")}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.receipt")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allPayments.map(({ payment, event, attendee, transportRoute }, index) => (
                    <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4 text-muted-foreground">{rowStart + index + 1}</td>
                      <td className="px-4 py-4">
                        <div className="text-foreground text-sm font-medium">
                          {new Date(payment.createdAt).toLocaleDateString(getIntlLocale(locale), {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/events/${event.slug}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {event.title}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {transportRoute?.name ?? t("common.noDataDash")}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        <div className="font-medium text-foreground">{attendee.name ?? t("common.guest")}</div>
                        <div>{attendee.email}</div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-foreground">
                        {formatCurrency(Number(payment.amount), payment.currency, locale)}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{payment.method}</td>
                      <td className="px-4 py-4">
                        <PaymentStatusBadge status={payment.status} />
                      </td>
                      <td className="px-4 py-4 max-w-[180px]">
                        <PaymentStatusSelect
                          paymentId={payment.id}
                          currentStatus={payment.status}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          {payment.receiptUrl ? (
                            <a
                              href={payment.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-primary hover:underline"
                            >
                              {t("common.viewReceipt")}
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">{t("common.noReceipt")}</span>
                          )}
                          {payment.notes && (
                            <PaymentNotesButton
                              notes={payment.notes}
                              eventName={event.title}
                              attendeeName={attendee.name ?? undefined}
                              amountFormatted={formatCurrency(Number(payment.amount), payment.currency, locale)}
                              receiptUrl={payment.receiptUrl}
                              receiptFileName={payment.receiptFileName}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <TablePagination
              basePath="/admin/payments"
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
          </>
        )}
      </div>
    </div>
  );
}
