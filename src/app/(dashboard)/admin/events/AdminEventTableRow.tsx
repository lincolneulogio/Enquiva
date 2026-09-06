import Link from "next/link";
import { DeleteEventButton } from "@/components/events/DeleteEventButton";
import { ToggleEventFeaturedButton } from "@/components/dashboard/admin/ToggleEventFeaturedButton";
import { categoryLabel, eventStatusLabel, formatCurrency } from "@/lib/utils";
import { getIntlLocale } from "@/lib/i18n/core";
import {
  VIEWER_EVENT_STATUS_I18N_KEY,
  type ViewerEventStatus,
} from "@/lib/events/viewer-event-status";
import { ViewerEventStatusBadge } from "@/components/events/ViewerEventStatusBadge";

const statusColor: Record<string, string> = {
  published: "bg-green-100 text-green-900 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30",
  draft: "bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30",
  cancelled: "bg-red-100 text-red-900 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30",
  completed: "bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/30",
};

export interface AdminEventItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  date: Date;
  price: string | null;
  capacity: number | null;
  isFeatured: boolean | null;
  organizerId: string;
  organizationId: string | null;
  organizerName: string | null;
}

interface AdminEventTableRowProps {
  event: AdminEventItem;
  index: number;
  rowStart: number;
  locale: "en" | "es";
  regCount: number;
  viewerStatus: ViewerEventStatus;
  canMutate: boolean;
  isSuperAdmin: boolean;
  eventsPath: string;
  viewerStatusLabel: string;
  viewLabel: string;
  editLabel: string;
}

export function AdminEventTableRow({
  event,
  index,
  rowStart,
  locale,
  regCount,
  viewerStatus,
  canMutate,
  isSuperAdmin,
  eventsPath,
  viewerStatusLabel,
  viewLabel,
  editLabel,
}: AdminEventTableRowProps) {
  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-2 py-3 text-muted-foreground">{rowStart + index + 1}</td>
      <td className="truncate px-2 py-3 font-medium text-foreground" title={event.title}>
        {event.title}
      </td>
      <td className="truncate px-2 py-3 text-muted-foreground" title={event.organizerName ?? ""}>
        {event.organizerName ?? "—"}
      </td>
      <td className="truncate px-2 py-3 text-muted-foreground">
        {categoryLabel(event.category, locale)}
      </td>
      <td className="px-2 py-3 text-right font-semibold text-foreground">
        {event.price && Number(event.price) > 0
          ? formatCurrency(Number(event.price), "PEN", locale)
          : locale === "en" ? "Free" : "Gratuito"}
      </td>
      <td className="px-2 py-3 text-muted-foreground text-xs leading-relaxed">
        <div className="flex items-center gap-1 font-semibold text-foreground">
          <span className="text-primary">{regCount}</span>
          <span className="text-muted-foreground/60 font-normal">/</span>
          <span>{event.capacity ? `${event.capacity}` : "∞"}</span>
        </div>
        <span className="mt-0.5 hidden text-[9px] text-muted-foreground/80 2xl:block">
          {event.capacity
            ? locale === "en"
              ? `${event.capacity - regCount} remaining`
              : `${event.capacity - regCount} vacantes libres`
            : locale === "en"
              ? "unlimited vacancies"
              : "vacantes ilimitadas"}
        </span>
      </td>
      <td className="px-2 py-3 text-muted-foreground">
        {new Date(event.date).toLocaleDateString(getIntlLocale(locale), {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </td>
      <td className="px-2 py-3 text-center">
        <ToggleEventFeaturedButton
          eventId={event.id}
          isFeatured={Boolean(event.isFeatured)}
          canMutate={isSuperAdmin}
        />
      </td>
      <td className="overflow-hidden px-2 py-3">
        <span
          className={`inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor[event.status] ?? ""}`}
        >
          {eventStatusLabel(event.status, locale)}
        </span>
      </td>
      <td className="overflow-hidden px-2 py-3">
        <ViewerEventStatusBadge
          status={viewerStatus}
          label={viewerStatusLabel}
          className="max-w-full gap-1 truncate px-2 py-0.5 text-[10px]"
        />
      </td>
      <td className="px-2 py-3 text-right">
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-[10px] 2xl:text-xs">
          <Link
            href={`/events/${event.slug}`}
            target="_blank"
            className="text-primary hover:underline font-semibold"
          >
            {viewLabel}
          </Link>
          {canMutate ? (
            <>
              <Link
                href={`${eventsPath}/${event.id}`}
                className="text-blue-600 hover:underline dark:text-blue-400 font-semibold"
              >
                {editLabel}
              </Link>
              <DeleteEventButton eventId={event.id} />
            </>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
