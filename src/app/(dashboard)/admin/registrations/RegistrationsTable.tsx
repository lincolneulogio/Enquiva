import { ClipboardList } from "lucide-react";
import { TablePagination } from "@/components/dashboard/shared/TablePagination";
import { staffDashboardPath, type StaffDashboardBase } from "@/lib/navigation/dashboard-paths";
import { RegistrationTableRow } from "./RegistrationTableRow";
import type { fetchAdminRegistrationsData } from "./registrations-query";

type RegistrationItem = Awaited<ReturnType<typeof fetchAdminRegistrationsData>>["allRegistrations"][number];

interface RegistrationsTableProps {
  registrations: RegistrationItem[];
  total: number;
  isFiltered: boolean;
  locale: "en" | "es";
  staffBase: StaffDashboardBase;
  safePage: number;
  totalPages: number;
  pageSize: number;
  rowStart: number;
  guestToParentRegIdMap: Map<string, string>;
  paymentsMap: Map<string, { amount: string; status: string; method: string; currency: string }>;
  transportMap: Map<string, { seats: number; routeName: string | null; totalSeats: number | null }>;
  invitersMap: Map<string, { name: string | null; email: string }>;
  params: {
    eventId?: string;
    category?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  };
  labels: {
    noRegistrationsYet: string;
    noRegistrationsFilter: string;
    registrationsAppearHere: string;
    registrationsDirectory: string;
    scrollHorizontally: string;
    colAttendee: string;
    colEvent: string;
    colType: string;
    colPayment: string;
    colTransport: string;
    colOffersCert: string;
    colCertStatus: string;
    colStatus: string;
    colRegistered: string;
    colCheckedIn: string;
  };
}

export function RegistrationsTable({
  registrations: allRegistrations,
  total,
  isFiltered,
  locale,
  staffBase,
  safePage,
  totalPages,
  pageSize,
  rowStart,
  guestToParentRegIdMap,
  paymentsMap,
  transportMap,
  invitersMap,
  params,
  labels,
}: RegistrationsTableProps) {
  if (allRegistrations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <p className="mt-4 font-medium text-foreground">{labels.noRegistrationsYet}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isFiltered ? labels.noRegistrationsFilter : labels.registrationsAppearHere}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border bg-muted/10">
        <span className="text-xs font-semibold text-foreground flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          {labels.registrationsDirectory}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-medium">
          ↔ {labels.scrollHorizontally}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1880px] table-fixed text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[60px]">N°</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[220px]">{labels.colAttendee}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[220px]">{labels.colEvent}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[150px]">{labels.colType}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[150px]">{labels.colPayment}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[220px]">{labels.colTransport}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[190px]">{labels.colOffersCert}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[220px]">{labels.colCertStatus}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[130px]">{labels.colStatus}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[130px]">{labels.colRegistered}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[130px]">{labels.colCheckedIn}</th>
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
