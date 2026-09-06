import type { ExportCategoryOption, ExportEventOption } from "@/actions/exports";

export type StatusOption = {
  value: string;
  label: string;
};

interface ExportFilterControlsProps {
  eventId: string;
  status: string;
  category: string;
  fromDate: string;
  toDate: string;
  eventOptions: ExportEventOption[];
  categoryOptions: ExportCategoryOption[];
  statusOptions?: StatusOption[];
  enableDateRange: boolean;
  locale: "en" | "es";
  labels: {
    filterByEvent: string;
    allEventsOption: string;
    filterByCategory: string;
    allCategoriesOption: string;
    filterByStatus: string;
    allStatesOption: string;
    fromDate: string;
    toDate: string;
  };
  onFilterChange: (key: string, value: string) => void;
}

export function ExportFilterControls({
  eventId,
  status,
  category,
  fromDate,
  toDate,
  eventOptions,
  categoryOptions,
  statusOptions,
  enableDateRange,
  labels,
  onFilterChange,
}: ExportFilterControlsProps) {
  const hasEventFilter = eventOptions.length > 0;
  const hasCategoryFilter = categoryOptions.length > 0;
  const hasStatusFilter = Boolean(statusOptions?.length);

  return (
    <>
      {/* Event dropdown */}
      {hasEventFilter && (
        <div className="flex-1 min-w-[200px] max-w-xs space-y-1.5">
          <label htmlFor="export-event-select" className="text-xs font-semibold text-muted-foreground tracking-wide block">
            {labels.filterByEvent}
          </label>
          <select
            id="export-event-select"
            value={eventId}
            onChange={(e) => onFilterChange("eventId", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10 transition-all hover:bg-background/80"
          >
            <option value="">{labels.allEventsOption}</option>
            {eventOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Category dropdown */}
      {hasCategoryFilter && (
        <div className="flex-1 min-w-[160px] max-w-[200px] space-y-1.5">
          <label htmlFor="export-category-select" className="text-xs font-semibold text-muted-foreground tracking-wide block">
            {labels.filterByCategory}
          </label>
          <select
            id="export-category-select"
            value={category}
            onChange={(e) => onFilterChange("category", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10 transition-all hover:bg-background/80"
          >
            <option value="">{labels.allCategoriesOption}</option>
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status dropdown */}
      {hasStatusFilter && statusOptions && (
        <div className="flex-1 min-w-[140px] max-w-[180px] space-y-1.5">
          <label htmlFor="export-status-select" className="text-xs font-semibold text-muted-foreground tracking-wide block">
            {labels.filterByStatus}
          </label>
          <select
            id="export-status-select"
            value={status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10 transition-all hover:bg-background/80"
          >
            <option value="all">{labels.allStatesOption}</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Date range inputs */}
      {enableDateRange && (
        <>
          <div className="flex-1 min-w-[130px] max-w-[160px] space-y-1.5">
            <label htmlFor="export-from-date" className="text-xs font-semibold text-muted-foreground tracking-wide block">
              {labels.fromDate}
            </label>
            <input
              id="export-from-date"
              type="date"
              value={fromDate}
              onChange={(e) => onFilterChange("fromDate", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10 transition-all hover:bg-background/80 block"
            />
          </div>
          <div className="flex-1 min-w-[130px] max-w-[160px] space-y-1.5">
            <label htmlFor="export-to-date" className="text-xs font-semibold text-muted-foreground tracking-wide block">
              {labels.toDate}
            </label>
            <input
              id="export-to-date"
              type="date"
              value={toDate}
              onChange={(e) => onFilterChange("toDate", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10 transition-all hover:bg-background/80 block"
            />
          </div>
        </>
      )}
    </>
  );
}
