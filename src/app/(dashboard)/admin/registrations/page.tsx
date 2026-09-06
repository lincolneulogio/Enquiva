import { Suspense } from "react";
import { getI18n } from "@/lib/i18n/server";
import { categoryLabel, registrationStatusLabel } from "@/lib/utils";
import { ExportDataPanel } from "@/components/dashboard/admin/ExportDataPanel";
import { EventPresenceIndicator } from "@/components/events/EventPresenceIndicator";
import { getExportEventOptions } from "@/actions/exports";
import { getCategories } from "@/actions/events";
import { resolveAdminScope } from "@/lib/organizations/admin-scope";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import { RegistrationsTable } from "./RegistrationsTable";
import { fetchAdminRegistrationsData, type AdminRegistrationsQueryParams } from "./registrations-query";

interface AdminRegistrationsPageProps {
  searchParams: Promise<AdminRegistrationsQueryParams & { page?: string }>;
}

const PAGE_SIZE = 10;

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

  const {
    total,
    totalPages,
    safePage,
    offset,
    allRegistrations,
    invitersMap,
    guestToParentRegIdMap,
    paymentsMap,
    transportMap,
  } = await fetchAdminRegistrationsData({
    params,
    adminScope,
    currentPage,
    pageSize: PAGE_SIZE,
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

      <RegistrationsTable
        registrations={allRegistrations}
        total={total}
        isFiltered={isFiltered}
        locale={locale}
        staffBase={staffBase}
        safePage={safePage}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        rowStart={offset}
        guestToParentRegIdMap={guestToParentRegIdMap}
        paymentsMap={paymentsMap}
        transportMap={transportMap}
        invitersMap={invitersMap}
        params={params}
        labels={{
          noRegistrationsYet: t("dashboard.admin.noRegistrationsYet"),
          noRegistrationsFilter: locale === "en" ? "No registrations match your filters." : "Ninguna inscripción coincide con los filtros.",
          registrationsAppearHere: t("dashboard.admin.registrationsAppearHere"),
          registrationsDirectory: locale === "en" ? "Registrations Directory" : "Directorio de Inscripciones",
          scrollHorizontally: locale === "en" ? "Scroll horizontally to view all columns" : "Desliza horizontalmente para ver todas las columnas",
          colAttendee: t("common.attendee"),
          colEvent: t("common.event"),
          colType: locale === "en" ? "Type / Invited By" : "Tipo / Invitado Por",
          colPayment: locale === "en" ? "Payment" : "Pago",
          colTransport: locale === "en" ? "Transport" : "Transporte",
          colOffersCert: locale === "en" ? "Offers Certificate?" : "¿Ofrece Certificado?",
          colCertStatus: locale === "en" ? "Certificate Status" : "Certificado Solicitado / Pagado",
          colStatus: t("common.status"),
          colRegistered: t("common.registered"),
          colCheckedIn: t("common.checkedIn"),
        }}
      />
    </div>
  );
}
