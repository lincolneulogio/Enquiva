import Link from "next/link";
import { db } from "@/lib/db";
import {
  payments,
  registrations,
  events,
  users,
  transportBookings,
  transportRoutes,
  paymentStatusEnum,
} from "@/lib/db/schema";
import { eq, desc, and, gte, lte, count, type SQL } from "drizzle-orm";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { PaymentStatusSelect } from "@/components/payments/PaymentStatusSelect";
import { formatCurrency } from "@/lib/utils";
import { Calendar, CreditCard } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale, getPaymentStatusLabel } from "@/lib/i18n/core";
import { TablePagination } from "@/components/dashboard";
import { ExportDataPanel } from "@/components/dashboard";
import { getExportEventOptions } from "@/actions/exports";
import { getCategories } from "@/actions/events";
import { categoryLabel } from "@/lib/utils";
import { Suspense } from "react";
import { PaymentNotesButton } from "@/components/payments/PaymentNotesButton";
import { resolveAdminScope, scopeEventCondition, canMutateEventRecord } from "@/lib/organizations/admin-scope";
import { staffDashboardPath } from "@/lib/navigation/dashboard-paths";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeRole } from "@/lib/auth/rbac";

function getPaymentDynamicCaption(
  notes: string | null,
  registrationNotes: string | null,
  seatsCount: number | null,
  locale: string,
) {
  const isEn = locale === "en";

  // Calculate guests count from registrationNotes
  let guestCount = 0;
  if (registrationNotes && registrationNotes.startsWith("[GUESTS:")) {
    const content = registrationNotes
      .replace("[GUESTS:", "")
      .replace("]", "")
      .trim();
    if (content) {
      guestCount = content
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean).length;
    }
  }

  // Fallback to regex on payment notes if database records are blank
  if (guestCount === 0 && notes) {
    const guestMatch =
      notes.match(/y (\d+) invitado/i) || notes.match(/and (\d+) guest/i);
    if (guestMatch) guestCount = parseInt(guestMatch[1]);
  }

  let finalSeatsCount = seatsCount ?? 0;
  if (finalSeatsCount === 0 && notes) {
    const seatMatch =
      notes.match(/(\d+) asiento/i) || notes.match(/(\d+) seat/i);
    if (seatMatch) finalSeatsCount = parseInt(seatMatch[1]);
  }

  if (guestCount > 0 || finalSeatsCount > 0) {
    const parts = [];
    if (guestCount > 0) {
      parts.push(
        isEn
          ? `Owner + ${guestCount} guest${guestCount > 1 ? "s" : ""}`
          : `Titular + ${guestCount} invitado${guestCount > 1 ? "s" : ""}`,
      );
    } else {
      parts.push(isEn ? "1 ticket" : "1 entrada");
    }

    if (finalSeatsCount > 0) {
      parts.push(
        isEn
          ? `${finalSeatsCount} seat${finalSeatsCount > 1 ? "s" : ""}`
          : `${finalSeatsCount} asiento${finalSeatsCount > 1 ? "s" : ""}`,
      );
    }

    return parts.join(" · ");
  }

  if (
    notes &&
    (notes.toLowerCase().includes("offline") ||
      notes.toLowerCase().includes("manual"))
  ) {
    return isEn ? "Manual registration" : "Registro manual";
  }

  return null;
}

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

export default async function AdminPaymentsPage({
  searchParams,
}: AdminPaymentsPageProps) {
  const { locale, t } = await getI18n();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const role = normalizeRole(session.user.role);
  const staffBase = await getStaffBaseFromRequest();
  const params = await searchParams;
  const exportEventOptions = await getExportEventOptions("admin");
  const exportCategoryOptions = (await getCategories()).map((category) => ({
    value: category.slug,
    label: categoryLabel(category.slug, locale),
  }));
  const exportStatusOptions = ["all", "pending", "approved", "rejected"].map(
    (value) => ({
      value,
      label:
        value === "all"
          ? t("common.all")
          : getPaymentStatusLabel(value, locale),
    }),
  );

  const requestedPage = Number(params.page ?? "1");
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.floor(requestedPage)
      : 1;

  const adminScope = await resolveAdminScope();
  const entityOrgId = adminScope.mode === "org" ? adminScope.organizationId : null;
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
    const status = paymentStatusEnum.enumValues.find((value) => value === params.status);
    if (status) {
      conditions.push(eq(payments.status, status));
    }
  }
  if (params.fromDate) {
    conditions.push(
      gte(payments.createdAt, new Date(`${params.fromDate}T00:00:00.000`)),
    );
  }
  if (params.toDate) {
    conditions.push(
      lte(payments.createdAt, new Date(`${params.toDate}T23:59:59.999`)),
    );
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
    .leftJoin(
      transportBookings,
      eq(transportBookings.id, payments.transportBookingId),
    )
    .leftJoin(
      transportRoutes,
      eq(transportRoutes.id, transportBookings.routeId),
    )
    .where(whereClause)
    .orderBy(desc(payments.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const isFiltered = !!(
    params.eventId ||
    params.category ||
    (params.status && params.status !== "all") ||
    params.fromDate ||
    params.toDate
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          {t("common.payments")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("dashboard.admin.paymentsIntro")}
          {isFiltered && (
            <span className="ml-2 text-xs text-primary font-medium">
              ({locale === "en" ? "filtered" : "filtrado"})
            </span>
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

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {t("dashboard.admin.showingPayments", { count: total })}
            </span>
          </div>
        </div>
        {allPayments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-medium text-foreground">
              {t("dashboard.member.noPaymentsYet")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isFiltered
                ? locale === "en"
                  ? "No payments match your filters."
                  : "Ningún pago coincide con los filtros."
                : locale === "en"
                  ? "Payments will appear here when made."
                  : "Los pagos aparecerán aquí cuando se realicen."}
            </p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border bg-muted/10">
              <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                {locale === "en" ? "Payments Ledger" : "Libro de Pagos"}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-medium">
                ↔{" "}
                {locale === "en"
                  ? "Scroll horizontally to view all columns"
                  : "Desliza horizontalmente para ver todas las columnas"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1600px] table-fixed text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[60px]">
                      N°
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[110px]">
                      {t("common.payments")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[100px]">
                      {locale === "en" ? "Time" : "Hora"}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[200px]">
                      {t("common.event")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[240px]">
                      {t("common.attendee")}
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-[170px]">
                      {t("common.amount")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[100px]">
                      {t("common.method")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[140px]">
                      {locale === "en" ? "Reference" : "Referencia"}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[140px]">
                      {t("common.status")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[170px]">
                      {t("common.update")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[170px]">
                      {t("common.receipt")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allPayments.map(
                    (
                      {
                        payment,
                        registration,
                        event,
                        attendee,
                        transportBooking,
                        transportRoute,
                      },
                      index,
                    ) => {
                      const canUpdateStatus = canMutateEventRecord(
                        {
                          organizerId: event.organizerId,
                          organizationId: event.organizationId,
                        },
                        session.user.id,
                        role,
                        entityOrgId,
                      );

                      return (
                      <tr
                        key={payment.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-4 text-muted-foreground">
                          {rowStart + index + 1}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-foreground text-sm font-medium">
                            {new Date(payment.createdAt).toLocaleDateString(
                              getIntlLocale(locale),
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-foreground text-sm font-medium whitespace-nowrap">
                            {new Date(payment.createdAt).toLocaleTimeString(
                              getIntlLocale(locale),
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: true,
                              },
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/events/${event.slug}`}
                            className="font-medium text-foreground hover:text-primary transition-colors block truncate"
                            title={event.title}
                          >
                            {event.title}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          <div
                            className="font-medium text-foreground truncate"
                            title={attendee.name ?? ""}
                          >
                            {attendee.name ?? t("common.guest")}
                          </div>
                          <div
                            className="text-xs text-muted-foreground truncate"
                            title={attendee.email ?? ""}
                          >
                            {attendee.email}
                          </div>
                          {registration.contactPhone && (
                            <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                              {registration.contactPhone}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right text-sm">
                          <div className="font-semibold text-foreground">
                            {formatCurrency(
                              Number(payment.amount),
                              payment.currency,
                              locale,
                            )}
                          </div>
                          {getPaymentDynamicCaption(
                            payment.notes,
                            registration.notes,
                            transportBooking?.seats ?? null,
                            locale,
                          ) && (
                            <div
                              className="text-[10px] text-muted-foreground/80 mt-0.5 truncate"
                              title={
                                getPaymentDynamicCaption(
                                  payment.notes,
                                  registration.notes,
                                  transportBooking?.seats ?? null,
                                  locale,
                                )!
                              }
                            >
                              {getPaymentDynamicCaption(
                                payment.notes,
                                registration.notes,
                                transportBooking?.seats ?? null,
                                locale,
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground uppercase font-mono">
                          {payment.method}
                        </td>
                        <td
                          className="px-4 py-4 text-sm text-muted-foreground font-mono truncate"
                          title={payment.reference ?? ""}
                        >
                          {payment.reference || (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <PaymentStatusBadge status={payment.status} />
                        </td>
                        <td className="px-4 py-4 max-w-[170px]">
                          {canUpdateStatus ? (
                            <PaymentStatusSelect
                              paymentId={payment.id}
                              currentStatus={payment.status}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {locale === "en" ? "View only" : "Solo lectura"}
                            </span>
                          )}
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
                              <span className="text-xs text-muted-foreground">
                                {t("common.noReceipt")}
                              </span>
                            )}
                            {payment.notes && (
                              <PaymentNotesButton
                                notes={payment.notes}
                                eventName={event.title}
                                attendeeName={attendee.name ?? undefined}
                                amountFormatted={formatCurrency(
                                  Number(payment.amount),
                                  payment.currency,
                                  locale,
                                )}
                                receiptUrl={payment.receiptUrl}
                                receiptFileName={payment.receiptFileName}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              basePath={staffDashboardPath(staffBase, "/payments")}
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
