import {
  BadgeCheck,
  Clock3,
  CreditCard,
  UserRoundCheck,
  XCircle,
} from "lucide-react";
import type { ViewerEventStatus } from "@/lib/events/viewer-event-status";
import { cn } from "@/lib/utils";

const statusStyles: Record<
  ViewerEventStatus,
  { className: string; Icon: typeof BadgeCheck }
> = {
  guest: {
    className: "border-border bg-muted text-muted-foreground",
    Icon: UserRoundCheck,
  },
  not_registered: {
    className:
      "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
    Icon: UserRoundCheck,
  },
  registered: {
    className:
      "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    Icon: BadgeCheck,
  },
  reserved: {
    className:
      "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
    Icon: Clock3,
  },
  reservation_expired: {
    className:
      "border-rose-300 bg-rose-100 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300",
    Icon: XCircle,
  },
  paid: {
    className:
      "border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300",
    Icon: CreditCard,
  },
  payment_rejected: {
    className:
      "border-rose-300 bg-rose-100 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300",
    Icon: XCircle,
  },
  waitlisted: {
    className:
      "border-violet-300 bg-violet-100 text-violet-900 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300",
    Icon: Clock3,
  },
  checked_in: {
    className:
      "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    Icon: BadgeCheck,
  },
};

export function ViewerEventStatusBadge({
  status,
  label,
  className,
}: {
  status: ViewerEventStatus;
  label: string;
  className?: string;
}) {
  const { Icon, className: statusClassName } = statusStyles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        statusClassName,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
