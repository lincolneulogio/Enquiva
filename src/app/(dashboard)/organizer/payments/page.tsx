import { db } from "@/lib/db";
import { payments as paymentsTable, registrations, events, users, transportBookings, transportRoutes, paymentStatusEnum } from "@/lib/db/schema";
import { eq, desc, and, gte, lte, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { formatCurrency } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { ExportDataPanel, TablePagination } from "@/components/dashboard";
import { Suspense } from "react";
import { getExportEventOptions } from "@/actions/exports";
import { getCategories } from "@/actions/events";
import { categoryLabel } from "@/lib/utils";
import { getPaymentStatusLabel } from "@/lib/i18n/core";
import { PaymentNotesButton } from "@/components/payments/PaymentNotesButton";
import { PaymentStatusSelect } from "@/components/payments/PaymentStatusSelect";
import { getPaymentMethodLabel } from "@/lib/payments/labels";
import { getMyPlanSummary } from "@/actions/billing";
import { planIncludesFeature } from "@/lib/billing/enforce";
import { Clock, CreditCard } from "lucide-react";
import { EmptyStateCard } from "@/components/ui/EmptyStateCard";

import { countGuestsFromNotes } from "@/lib/registrations/guests";

function getPaymentDynamicCaption(
  notes: string | null,
  registrationNotes: string | null,
  seatsCount: number | null,
  locale: string
) {
  const isEn = locale === "en";
  
  let guestCount = countGuestsFromNotes(registrationNotes);

  // Fallback to regex on payment notes if database records are blank
  if (guestCount === 0 && notes) {
    const guestMatch = notes.match(/y (\d+) invitado/i) || notes.match(/and (\d+) guest/i);
    if (guestMatch) guestCount = parseInt(guestMatch[1]);
  }

  let finalSeatsCount = seatsCount ?? 0;
  if (finalSeatsCount === 0 && notes) {
    const seatMatch = notes.match(/(\d+) asiento/i) || notes.match(/(\d+) seat/i);
    if (seatMatch) finalSeatsCount = parseInt(seatMatch[1]);
  }

  if (guestCount > 0 || finalSeatsCount > 0) {
    const parts = [];
    if (guestCount > 0) {
      parts.push(
        isEn 
          ? `Owner + ${guestCount} guest${guestCount > 1 ? "s" : ""}` 
          : `Titular + ${guestCount} invitado${guestCount > 1 ? "s" : ""}`
      );
    } else {
      parts.push(isEn ? "1 ticket" : "1 entrada");
    }
    
    if (finalSeatsCount > 0) {
      parts.push(
        isEn 
          ? `${finalSeatsCount} seat${finalSeatsCount > 1 ? "s" : ""}` 
          : `${finalSeatsCount} asiento${finalSeatsCount > 1 ? "s" : ""}`
      );
    }
    
    return parts.join(" · ");
  }

  if (notes && (notes.toLowerCase().includes("offline") || notes.toLowerCase().includes("manual"))) {
    return isEn ? "Manual registration" : "Registro manual";
  }

  return null;
}

const PAGE_SIZE = 10;

interface PageProps {
  searchParams: Promise<{
    page?: string;
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
  const planSummary = await getMyPlanSummary();
  const showExports = planIncludesFeature(planSummary.plan, "exports", planSummary.isUnlimited);

  const requestedPage = Number(params.page ?? "1");
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

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
    const status = paymentStatusEnum.enumValues.find((value) => value === params.status);
    if (status) {
      conditions.push(eq(paymentsTable.status, status));
    }
  }
  if (params.fromDate) {
    conditions.push(gte(paymentsTable.createdAt, new Date(`${params.fromDate}T00:00:00.000`)));
  }
  if (params.toDate) {
    conditions.push(lte(paymentsTable.createdAt, new Date(`${params.toDate}T23:59:59.999`)));
  }

  const whereClause = and(...conditions);

  const [{ total }] = await db
    .select({ total: count() })
    .from(paymentsTable)
    .innerJoin(registrations, eq(paymentsTable.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(users, eq(paymentsTable.userId, users.id))
    .where(whereClause);

  const pendingConditions = [...conditions, eq(paymentsTable.status, "pending")];
  const [{ pendingCount }] = await db
    .select({ pendingCount: count() })
    .from(paymentsTable)
    .innerJoin(registrations, eq(paymentsTable.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .where(and(...pendingConditions));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;

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
    .innerJoin(registrations, eq(paymentsTable.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(users, eq(paymentsTable.userId, users.id))
    .leftJoin(transportBookings, eq(transportBookings.id, paymentsTable.transportBookingId))
    .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
    .where(whereClause)
    .orderBy(desc(paymentsTable.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.payments")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("dashboard.organizer.paymentsIntro")}
        </p>
      </div>

      {pendingCount > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium text-foreground">
              {t("payments.organizer.pendingBanner", { count: pendingCount })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("payments.organizer.pendingHelp")}
            </p>
          </div>
        </div>
      )}

      {showExports ? (
        <Suspense>
          <ExportDataPanel
            resource="payments"
            scope="organizer"
            eventOptions={exportEventOptions}
            categoryOptions={exportCategoryOptions}
            statusOptions={exportStatusOptions}
          />
        </Suspense>
      ) : null}

      {payments.length === 0 ? (
        <EmptyStateCard
          icon={CreditCard}
          title={t("payments.organizer.emptyTitle")}
          description={t("payments.organizer.emptyDescription")}
          action={{ label: t("payments.organizer.emptyCta"), href: "/organizer/events" }}
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <p className="px-3 pt-2 text-[11px] text-muted-foreground sm:hidden">↔ Scroll</p>
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.event")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.attendee")}</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t("common.amount")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.method")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.status")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.receipt")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.update")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map(({ payment, registration, event, attendee, transportBooking, transportRoute }) => (
                  <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4">
                      <Link href={`/events/${event.slug}`} className="font-medium text-foreground hover:text-primary">
                        {event.title}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      <div className="font-medium text-foreground">{attendee.name ?? t("common.guest")}</div>
                      <div>{attendee.email}</div>
                    </td>
                    <td className="px-4 py-4 text-right text-sm">
                      <div className="font-semibold text-foreground">
                        {formatCurrency(Number(payment.amount), payment.currency, locale)}
                      </div>
                      {getPaymentDynamicCaption(payment.notes, registration.notes, transportBooking?.seats ?? null, locale) && (
                        <div className="text-[10px] text-muted-foreground/80 mt-0.5 whitespace-nowrap">
                          {getPaymentDynamicCaption(payment.notes, registration.notes, transportBooking?.seats ?? null, locale)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {getPaymentMethodLabel(payment.method, locale)}
                      {payment.gatewayProvider === "culqi" && payment.status === "approved" && (
                        <span className="mt-0.5 block text-[10px] text-violet-600 dark:text-violet-400">
                          {t("payments.organizer.autoApproved")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-start gap-1">
                        {payment.receiptUrl ? (
                          <a href={payment.receiptUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline">
                            {t("common.viewReceipt")}
                          </a>
                        ) : payment.method === "culqi" ? (
                          <span className="text-xs text-muted-foreground">{t("payments.organizer.noReceiptNeeded")}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t("common.awaitingReceipt")}</span>
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
                    <td className="px-4 py-4 min-w-[140px]">
                      {payment.method === "culqi" && payment.status === "approved" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <PaymentStatusSelect paymentId={payment.id} currentStatus={payment.status} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            basePath="/organizer/payments"
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
