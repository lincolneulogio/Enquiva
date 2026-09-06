import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminKpiCardProps = {
  label: string;
  value: string;
  color: string;
  iconBg: string;
  Icon: LucideIcon;
  href?: string;
  delta?: number | null;
  periodLabel?: string;
};

function DeltaBadge({ delta, periodLabel }: { delta: number; periodLabel?: string }) {
  const positive = delta > 0;
  const negative = delta < 0;
  const Icon = positive ? TrendingUp : negative ? TrendingDown : null;

  return (
    <p
      className={cn(
        "mt-2 flex items-center gap-1 text-xs",
        positive && "text-emerald-600 dark:text-emerald-400",
        negative && "text-red-600 dark:text-red-400",
        !positive && !negative && "text-muted-foreground",
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      <span>
        {positive ? "+" : ""}
        {delta}%
        {periodLabel ? ` ${periodLabel}` : ""}
      </span>
    </p>
  );
}

export function AdminKpiCard({
  label,
  value,
  color,
  iconBg,
  Icon,
  href,
  delta,
  periodLabel,
}: AdminKpiCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        {href ? (
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
        ) : null}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-3xl font-semibold ${color} sm:text-4xl`}>{value}</p>
      {delta != null ? <DeltaBadge delta={delta} periodLabel={periodLabel} /> : null}
    </>
  );

  if (!href) {
    return <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">{content}</div>;
  }

  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md sm:p-6"
    >
      {content}
    </Link>
  );
}
