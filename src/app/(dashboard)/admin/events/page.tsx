import Link from "next/link";
import { Plus, Star } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { categoryLabel } from "@/lib/utils";
import { ExportDataPanel } from "@/components/dashboard/admin/ExportDataPanel";
import { getExportEventOptions } from "@/actions/exports";
import { getCategories } from "@/actions/events";
import { Suspense } from "react";
import { resolveAdminScope } from "@/lib/organizations/admin-scope";
import { staffDashboardPath } from "@/lib/navigation/dashboard-paths";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import { getRequestSession } from "@/lib/request-context";
import { normalizeRole } from "@/lib/auth/rbac";
import { AdminEventsTable } from "./AdminEventsTable";
import { fetchAdminEventsData, type AdminEventsQueryParams } from "./events-query";

interface AdminEventsPageProps {
  searchParams: Promise<AdminEventsQueryParams & { page?: string }>;
}

const PAGE_SIZE = 10;
const EVENT_STATUS_VALUES = ["all", "published", "draft", "cancelled", "completed"] as const;

export default async function AdminEventsPage({ searchParams }: AdminEventsPageProps) {
  const { locale, t } = await getI18n();
  const session = await getRequestSession();
  const role = normalizeRole(session?.user?.role);
  const canCreateEvents = role === "super_admin";
  const staffBase = await getStaffBaseFromRequest();
  const eventsPath = staffDashboardPath(staffBase, "events");
  const adminScope = await resolveAdminScope();
  const entityOrgId = adminScope.mode === "org" ? adminScope.organizationId : null;
  const params = await searchParams;
  const requestedPage = Number(params.page ?? "1");
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  const exportEventOptions = await getExportEventOptions("admin");
  const categories = await getCategories();
  const exportCategoryOptions = categories.map((category) => ({
    value: category.slug,
    label: categoryLabel(category.slug, locale),
  }));
  const exportStatusOptions = EVENT_STATUS_VALUES.map((value) => ({
    value,
    label: value === "all" ? t("common.all") : t(`eventStatus.${value}`),
  }));

  const {
    total,
    featuredTotal,
    totalPages,
    safePage,
    offset,
    allEvents,
    regCountsMap,
    viewerStatuses,
  } = await fetchAdminEventsData({
    params,
    adminScope,
    currentPage,
    pageSize: PAGE_SIZE,
    sessionUserId: session?.user?.id,
  });

  const isFiltered = !!(
    params.eventId ||
    params.category ||
    (params.status && params.status !== "all") ||
    params.fromDate ||
    params.toDate
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">
            {t("dashboard.admin.allEvents")}
          </h1>
          <p className="mt-1 text-muted-foreground flex flex-wrap items-center gap-2">
            <span>
              {t("dashboard.admin.eventsOnPlatform", {
                count: total,
                label: total === 1 ? "evento" : "eventos",
              })}
            </span>
            {isFiltered && (
              <span className="text-xs text-primary font-medium">
                ({locale === "en" ? "filtered" : "filtrado"})
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              {locale === "en"
                ? `${featuredTotal} featured on landing`
                : `${featuredTotal} destacados en portada`}
            </span>
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link
            href="/events"
            className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:w-auto"
          >
            {t("dashboard.member.exploreEvents")}
          </Link>
          {canCreateEvents && (
            <Link
              href={`${eventsPath}/new`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              {t("common.createEvent")}
            </Link>
          )}
        </div>
      </div>

      <Suspense>
        <ExportDataPanel
          resource="events"
          scope="admin"
          eventOptions={exportEventOptions}
          categoryOptions={exportCategoryOptions}
          statusOptions={exportStatusOptions}
        />
      </Suspense>

      <AdminEventsTable
        events={allEvents}
        total={total}
        isFiltered={isFiltered}
        canCreateEvents={canCreateEvents}
        eventsPath={eventsPath}
        locale={locale}
        safePage={safePage}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        rowStart={offset}
        regCountsMap={regCountsMap}
        viewerStatuses={viewerStatuses}
        sessionUserId={session?.user?.id}
        role={role}
        entityOrgId={entityOrgId}
        params={params}
        labels={{
          noEventsYet: t("dashboard.admin.noEventsYet"),
          noEventsFilter: locale === "en" ? "No events match your filters." : "Ningún evento coincide con los filtros.",
          adminCannotCreateEvents: t("auth.adminCannotCreateEventsBody"),
          createEvent: t("common.createEvent"),
          eventsLedger: locale === "en" ? "Events Ledger" : "Directorio de Eventos",
          scrollHorizontally: locale === "en" ? "Scroll horizontally to view all columns" : "Desliza horizontalmente para ver todas las columnas",
          colTitle: t("dashboard.admin.title"),
          colOrganizer: t("common.organizer"),
          colCategory: t("common.category"),
          colPrice: locale === "en" ? "Price" : "Precio",
          colCapacity: locale === "en" ? "Capacity / Registrants" : "Aforo / Inscritos",
          colEventDate: locale === "en" ? "Event Date" : "Fecha de Evento",
          colLanding: locale === "en" ? "Landing" : "Portada",
          colEventStatus: t("public.events.viewerStatus.eventStatusLabel"),
          colViewerStatus: t("public.events.viewerStatus.label"),
          colActions: t("common.actions"),
          view: t("common.view"),
          edit: t("common.edit"),
          getViewerStatusLabel: (key: string) => t(key as any),
        }}
      />
    </div>
  );
}
