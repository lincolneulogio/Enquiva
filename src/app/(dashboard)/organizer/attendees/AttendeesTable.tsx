import { TablePagination } from "@/components/dashboard/shared/TablePagination";
import type { Locale } from "@/lib/i18n/core";
import type { AttendeeRow, AttendeeQueryParams } from "./attendees-query";
import { AttendeeTableRow } from "./AttendeeTableRow";

interface AttendeesTableProps {
  rows: AttendeeRow[];
  locale: Locale;
  t: (key: string) => string;
  safePage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  params: AttendeeQueryParams;
}

export function AttendeesTable({
  rows,
  locale,
  t,
  safePage,
  totalPages,
  total,
  pageSize,
  params,
}: AttendeesTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <p className="px-3 pt-2 text-[11px] text-muted-foreground sm:hidden">
        ↔ Scroll
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1320px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                {t("common.name")}
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                {t("common.email")}
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                {t("common.event")}
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                {t("common.date")}
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                {locale === "en" ? "Offers Cert.?" : "¿Ofrece Cert.?"}
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                {locale === "en" ? "Cert. Status" : "Certificado"}
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                {t("common.status")}
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                {t("dashboard.organizer.checkedInAt")}
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                {t("common.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <AttendeeTableRow
                key={row.registrationId}
                row={row}
                locale={locale}
                noActionLabel={t("dashboard.organizer.noAction")}
              />
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        basePath="/organizer/attendees"
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        query={{
          eventId: params.eventId,
          category: params.category,
          status: params.status,
          fromDate: params.fromDate,
          toDate: params.toDate,
        }}
      />
    </div>
  );
}
