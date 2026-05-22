import { db } from "@/lib/db";
import { payments as paymentsTable, registrations, events, users, transportBookings, transportRoutes } from "@/lib/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { formatCurrency } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { ExportDataPanel } from "@/components/dashboard/ExportDataPanel";
import { Suspense } from "react";
import { getExportEventOptions } from "@/actions/exports";
import { getCategories } from "@/actions/events";
import { categoryLabel } from "@/lib/utils";
import { getPaymentStatusLabel } from "@/lib/i18n/core";


interface PageProps {
  searchParams: Promise<{
    eventId?: string;
    category?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }>;
}

export default async function OrganizerPaymentsPage({ searchParams }: PageProps) {
  const { locale, t } = await getI18n();
  const params = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  const organizerId = session!.user.id;
  const exportEventOptions = await getExportEventOptions("organizer");
  const exportCategoryOptions = (await getCategories()).map((category) => ({
    value: category.slug,
    label: categoryLabel(category.slug, locale),
  }));
  const exportStatusOptions = ["all", "pending", "approved", "rejected"].map((value) => ({
    value,
    label: value === "all" ? t("common.all") : getPaymentStatusLabel(value, locale),
  }));

  const conditions = [eq(events.organizerId, organizerId)];

  if (params.eventId) {
    conditions.push(eq(events.id, params.eventId));
  }
  if (params.category) {
    conditions.push(eq(events.category, params.category));
  }
  if (params.status && params.status !== "all") {
    conditions.push(eq(paymentsTable.status, params.status as any));
  }
  if (params.fromDate) {
    conditions.push(gte(paymentsTable.createdAt, new Date(`${params.fromDate}T00:00:00.000`)));
  }
  if (params.toDate) {
    conditions.push(lte(paymentsTable.createdAt, new Date(`${params.toDate}T23:59:59.999`)));
  }

  const payments = await db
    .select({
      payment: paymentsTable,
      registration: registrations,
      event: events,
      attendee: users,
      transportBooking: transportBookings,
      transportRoute: transportRoutes,
    })
    .from(paymentsTable)
    .innerJoin(
      registrations,
      eq(paymentsTable.registrationId, registrations.id)
    )
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(users, eq(paymentsTable.userId, users.id))
    .leftJoin(transportBookings, eq(transportBookings.id, paymentsTable.transportBookingId))
    .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
    .where(and(...conditions))
    .orderBy(desc(paymentsTable.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.payments")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("dashboard.organizer.paymentsIntro")}
        </p>
      </div>

      <Suspense>
        <ExportDataPanel
          resource="payments"
          scope="organizer"
          eventOptions={exportEventOptions}
          categoryOptions={exportCategoryOptions}
          statusOptions={exportStatusOptions}
        />
      </Suspense>

      {payments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-lg font-semibold text-foreground">{t("dashboard.member.noPaymentsYet")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando los asistentes reserven transporte aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <p className="px-3 pt-2 text-[11px] text-muted-foreground sm:hidden">↔ Scroll</p>
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.event")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.route")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.attendee")}</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t("common.amount")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.status")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.receipt")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map(({ payment, event, attendee, transportRoute }) => (
                  <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4">
                      <Link href={`/events/${event.slug}`} className="font-medium text-foreground hover:text-primary">
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
                    <td className="px-4 py-4 text-right font-semibold text-foreground">
                      {formatCurrency(Number(payment.amount), payment.currency, locale)}
                    </td>
                    <td className="px-4 py-4">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-4">
                      {payment.receiptUrl ? (
                        <a href={payment.receiptUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline">
                          {t("common.viewReceipt")}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("common.awaitingReceipt")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
