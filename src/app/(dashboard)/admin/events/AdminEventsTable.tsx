import Link from "next/link";
import { Calendar, Plus, ClipboardList } from "lucide-react";
import { TablePagination } from "@/components/dashboard/shared/TablePagination";
import { canMutateEventRecord } from "@/lib/organizations/admin-scope";
import {
  VIEWER_EVENT_STATUS_I18N_KEY,
  type ViewerEventStatus,
} from "@/lib/events/viewer-event-status";
import { AdminEventTableRow, type AdminEventItem } from "./AdminEventTableRow";

interface AdminEventsTableProps {
  events: AdminEventItem[];
  total: number;
  isFiltered: boolean;
  canCreateEvents: boolean;
  eventsPath: string;
  locale: "en" | "es";
  safePage: number;
  totalPages: number;
  pageSize: number;
  rowStart: number;
  regCountsMap: Map<string, number>;
  viewerStatuses: Map<string, ViewerEventStatus>;
  sessionUserId?: string;
  role: string;
  entityOrgId: string | null;
  params: {
    eventId?: string;
    category?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  };
  labels: {
    noEventsYet: string;
    noEventsFilter: string;
    adminCannotCreateEvents: string;
    createEvent: string;
    eventsLedger: string;
    scrollHorizontally: string;
    colTitle: string;
    colOrganizer: string;
    colCategory: string;
    colPrice: string;
    colCapacity: string;
    colEventDate: string;
    colLanding: string;
    colEventStatus: string;
    colViewerStatus: string;
    colActions: string;
    view: string;
    edit: string;
    getViewerStatusLabel: (key: string) => string;
  };
}

export function AdminEventsTable({
  events: allEvents,
  total,
  isFiltered,
  canCreateEvents,
  eventsPath,
  locale,
  safePage,
  totalPages,
  pageSize,
  rowStart,
  regCountsMap,
  viewerStatuses,
  sessionUserId,
  role,
  entityOrgId,
  params,
  labels,
}: AdminEventsTableProps) {
  if (allEvents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <Calendar className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <p className="mt-4 font-medium text-foreground">{labels.noEventsYet}</p>
        {isFiltered ? (
          <p className="mt-1 text-sm text-muted-foreground">{labels.noEventsFilter}</p>
        ) : canCreateEvents ? (
          <Link
            href={`${eventsPath}/new`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> {labels.createEvent}
          </Link>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{labels.adminCannotCreateEvents}</p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border bg-muted/10">
        <span className="text-xs font-semibold text-foreground flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          {labels.eventsLedger}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-medium lg:hidden">
          ↔ {labels.scrollHorizontally}
        </span>
      </div>
      <div className="overflow-x-auto lg:overflow-x-visible">
        <table className="w-full min-w-[980px] table-fixed text-xs lg:min-w-0 2xl:text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="w-[4%] px-2 py-3 text-left font-medium text-muted-foreground">N°</th>
              <th className="w-[15%] px-2 py-3 text-left font-medium text-muted-foreground">{labels.colTitle}</th>
              <th className="w-[11%] px-2 py-3 text-left font-medium text-muted-foreground">{labels.colOrganizer}</th>
              <th className="w-[8%] px-2 py-3 text-left font-medium text-muted-foreground">{labels.colCategory}</th>
              <th className="w-[8%] px-2 py-3 text-right font-medium text-muted-foreground">{labels.colPrice}</th>
              <th className="w-[8%] px-2 py-3 text-left font-medium text-muted-foreground">{labels.colCapacity}</th>
              <th className="w-[8%] px-2 py-3 text-left font-medium text-muted-foreground">{labels.colEventDate}</th>
              <th className="w-[8%] px-2 py-3 text-center font-medium text-muted-foreground">{labels.colLanding}</th>
              <th className="w-[8%] px-2 py-3 text-left font-medium text-muted-foreground">{labels.colEventStatus}</th>
              <th className="w-[12%] px-2 py-3 text-left font-medium text-muted-foreground">{labels.colViewerStatus}</th>
              <th className="w-[10%] px-2 py-3 text-right font-medium text-muted-foreground">{labels.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {allEvents.map((event, index) => {
              const regCount = regCountsMap.get(event.id) ?? 0;
              const viewerStatus = viewerStatuses.get(event.id) ?? "not_registered";
              const canMutate = Boolean(
                sessionUserId &&
                  canMutateEventRecord(
                    {
                      organizerId: event.organizerId,
                      organizationId: event.organizationId,
                    },
                    sessionUserId,
                    role,
                    entityOrgId,
                  ),
              );

              return (
                <AdminEventTableRow
                  key={event.id}
                  event={event}
                  index={index}
                  rowStart={rowStart}
                  locale={locale}
                  regCount={regCount}
                  viewerStatus={viewerStatus}
                  canMutate={canMutate}
                  isSuperAdmin={role === "super_admin"}
                  eventsPath={eventsPath}
                  viewerStatusLabel={labels.getViewerStatusLabel(VIEWER_EVENT_STATUS_I18N_KEY[viewerStatus])}
                  viewLabel={labels.view}
                  editLabel={labels.edit}
                />
              );
            })}
          </tbody>
        </table>
      </div>
      <TablePagination
        basePath={eventsPath}
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
