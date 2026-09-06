import Link from "next/link";
import { db } from "@/lib/db";
import { registrations, events, users, payments, transportBookings, transportRoutes, registrationStatusEnum, registrationGuests } from "@/lib/db/schema";
import { eq, desc, count, and, gte, lte, sql, inArray, type SQL } from "drizzle-orm";
import { isGuestRegistration } from "@/lib/registrations/guests";
import { ClipboardList } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";
import { categoryLabel, registrationStatusLabel } from "@/lib/utils";
import { TablePagination } from "@/components/dashboard/shared/TablePagination";
import { ExportDataPanel } from "@/components/dashboard/admin/ExportDataPanel";
import { EventPresenceIndicator } from "@/components/events/EventPresenceIndicator";
import { getExportEventOptions } from "@/actions/exports";
import { getCategories } from "@/actions/events";
import { Suspense } from "react";
import { resolveAdminScope, scopeEventCondition } from "@/lib/organizations/admin-scope";
import { staffDashboardPath } from "@/lib/navigation/dashboard-paths";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import { RegistrationTableRow } from "./RegistrationTableRow";

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
  const staffBase = await getStaffBaseFromRequest();
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
    const status = registrationStatusEnum.enumValues.find((value) => value === params.status);
    if (status) {
      conditions.push(eq(registrations.status, status));
    }
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
    .leftJoin(users, eq(registrations.userId, users.id))
    .leftJoin(registrationGuests, eq(registrations.guestId, registrationGuests.id))
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
      guestId: registrations.guestId,
      parentRegistrationId: registrations.parentRegistrationId,
      wantsCertificate: registrations.wantsCertificate,
      certificateCode: registrations.certificateCode,
      event: {
        id: events.id,
        title: events.title,
        slug: events.slug,
        date: events.date,
        location: events.location,
        isVirtual: events.isVirtual,
        hasCertificate: events.hasCertificate,
        certificateTitle: events.certificateTitle,
        certificatePrice: events.certificatePrice,
      },
      attendee: {
        id: sql<string>`coalesce(${users.id}, ${registrationGuests.id}::text)`,
        name: sql<string>`coalesce(${registrationGuests.name}, ${users.name}, 'Asistente')`,
        email: users.email,
      },
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .leftJoin(users, eq(registrations.userId, users.id))
    .leftJoin(registrationGuests, eq(registrations.guestId, registrationGuests.id))
    .where(whereClause)
    .orderBy(desc(registrations.registeredAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  // Fetch parent registrants / inviters for guests on the current page
  const guestRegs = allRegistrations.filter((r) =>
    isGuestRegistration({
      guestId: r.guestId,
      parentRegistrationId: r.parentRegistrationId,
      email: r.attendee?.email,
    }),
  );
  const guestIds = guestRegs.map((r) => r.id);
  const invitersMap = new Map<string, { name: string | null; email: string }>();
  const guestToParentRegIdMap = new Map<string, string>();

  if (guestIds.length > 0) {
    try {
      const guestRows = await db
        .select({
          guestId: registrations.id,
          parentId: registrations.parentRegistrationId,
          notes: registrations.notes,
        })
        .from(registrations)
        .where(inArray(registrations.id, guestIds));

      const parentIdsFromFk = guestRows
        .map((g) => g.parentId)
        .filter((id): id is string => Boolean(id));

      // Legacy notes fallback for parents not yet backfilled
      const { parseGuestRegistrationIds } = await import("@/lib/registrations/guests");
      const eventId = allRegistrations[0].event.id;
      const parentsWithNotes = await db
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
            eq(registrations.eventId, eventId),
            sql`${registrations.notes} IS NOT NULL`,
          ),
        );

      const parentIds = new Set([
        ...parentIdsFromFk,
        ...parentsWithNotes
          .filter((p) => parseGuestRegistrationIds(p.notes).some((id) => guestIds.includes(id)))
          .map((p) => p.id),
      ]);

      if (parentIds.size > 0) {
        const parents = await db
          .select({
            id: registrations.id,
            inviterName: users.name,
            inviterEmail: users.email,
          })
          .from(registrations)
          .innerJoin(users, eq(registrations.userId, users.id))
          .where(inArray(registrations.id, Array.from(parentIds)));

        const parentInfo = new Map(parents.map((p) => [p.id, p]));

        for (const guest of guestRows) {
          let parentId = guest.parentId;
          if (!parentId) {
            for (const p of parentsWithNotes) {
              if (parseGuestRegistrationIds(p.notes).includes(guest.guestId)) {
                parentId = p.id;
                break;
              }
            }
          }
          if (!parentId) continue;
          const info = parentInfo.get(parentId);
          if (!info) continue;
          invitersMap.set(guest.guestId, {
            name: info.inviterName,
            email: info.inviterEmail,
          });
          guestToParentRegIdMap.set(guest.guestId, parentId);
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
      {params.eventId ? (
        <EventPresenceIndicator eventId={params.eventId} variant="staff" />
      ) : null}

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
            <table className="w-full min-w-[1880px] table-fixed text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[60px]">N°</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[220px]">{t("common.attendee")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[220px]">{t("common.event")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[150px]">{locale === "en" ? "Type / Invited By" : "Tipo / Invitado Por"}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[150px]">{locale === "en" ? "Payment" : "Pago"}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[220px]">{locale === "en" ? "Transport" : "Transporte"}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[190px]">{locale === "en" ? "Offers Certificate?" : "¿Ofrece Certificado?"}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[220px]">{locale === "en" ? "Certificate Status" : "Certificado Solicitado / Pagado"}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[130px]">{t("common.status")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[130px]">{t("common.registered")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[130px]">{t("common.checkedIn")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allRegistrations.map((reg, index) => {
                  const parentRegId = guestToParentRegIdMap.get(reg.id);
                  const payment = paymentsMap.get(reg.id) || (parentRegId ? paymentsMap.get(parentRegId) : undefined);
                  const transport = transportMap.get(reg.id) || (parentRegId ? transportMap.get(parentRegId) : undefined);
                  return (
                    <RegistrationTableRow
                      key={reg.id}
                      reg={reg}
                      index={index}
                      rowStart={rowStart}
                      locale={locale}
                      inviter={invitersMap.get(reg.id)}
                      parentRegId={parentRegId}
                      payment={payment}
                      transport={transport}
                      hasOwnPayment={paymentsMap.has(reg.id)}
                      hasOwnTransport={transportMap.has(reg.id)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
          <TablePagination
            basePath={staffDashboardPath(staffBase, "/registrations")}
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
