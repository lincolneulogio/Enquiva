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
  subtext?: string;
  statusBadge?: {
    text: string;
    variant?: "emerald" | "blue" | "purple" | "neutral";
  };
  sparklineColor?: "blue" | "sky" | "emerald" | "purple";
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
};

function DeltaBadge({ delta, periodLabel }: { delta: number; periodLabel?: string }) {
  const positive = delta > 0;
  const negative = delta < 0;
  const Icon = positive ? TrendingUp : negative ? TrendingDown : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        positive && "text-emerald-600 dark:text-emerald-400",
        negative && "text-red-600 dark:text-red-400",
        !positive && !negative && "text-muted-foreground",
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      <span>
        {positive ? "+" : ""}
        {delta}%
      </span>
      {periodLabel ? <span className="text-muted-foreground/80">{periodLabel}</span> : null}
    </span>
  );
}

function SparklineWave({ color = "blue" }: { color?: "blue" | "sky" | "emerald" | "purple" }) {
  const colorMap = {
    blue: {
      stroke: "#2563eb",
      stopStart: "rgba(37, 99, 235, 0.18)",
      stopEnd: "rgba(37, 99, 235, 0.0)",
    },
    sky: {
      stroke: "#0284c7",
      stopStart: "rgba(2, 132, 199, 0.18)",
      stopEnd: "rgba(2, 132, 199, 0.0)",
    },
    emerald: {
      stroke: "#059669",
      stopStart: "rgba(5, 150, 105, 0.18)",
      stopEnd: "rgba(5, 150, 105, 0.0)",
    },
    purple: {
      stroke: "#7c3aed",
      stopStart: "rgba(124, 58, 237, 0.18)",
      stopEnd: "rgba(124, 58, 237, 0.0)",
    },
  };

  const cfg = colorMap[color] || colorMap.blue;
  const gradientId = `sparkline-grad-${color}`;

  return (
    <div className="relative mt-2 h-7 w-full overflow-hidden">
      <svg
        className="h-full w-full overflow-visible"
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cfg.stopStart} />
            <stop offset="100%" stopColor={cfg.stopEnd} />
          </linearGradient>
        </defs>
        <path
          d="M0,19 C25,19 45,18 65,12 C80,8 90,6 100,5 L100,24 L0,24 Z"
          fill={`url(#${gradientId})`}
        />
        <path
          d="M0,19 C25,19 45,18 65,12 C80,8 90,6 100,5"
          stroke={cfg.stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
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
  subtext,
  statusBadge,
  sparklineColor = "blue",
  footerLeft,
  footerRight,
}: AdminKpiCardProps) {
  const badgeClasses = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    blue: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
    purple: "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60",
    neutral: "bg-muted text-muted-foreground border-border",
  };

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        {href ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
            <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {value}
        </span>
        {subtext ? (
          <span className="text-xs font-medium text-muted-foreground">
            {subtext}
          </span>
        ) : null}
        {statusBadge ? (
          <span
            className={cn(
              "ml-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              badgeClasses[statusBadge.variant || "emerald"],
            )}
          >
            {statusBadge.text}
          </span>
        ) : null}
      </div>

      <SparklineWave color={sparklineColor} />

      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
        {footerLeft !== undefined || footerRight !== undefined ? (
          <>
            <div>{footerLeft}</div>
            <div>{footerRight}</div>
          </>
        ) : delta != null ? (
          <>
            <DeltaBadge delta={delta} />
            <span className="text-[11px] text-muted-foreground">{periodLabel || ""}</span>
          </>
        ) : null}
      </div>
    </>
  );

  const cardClassName =
    "group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-md sm:p-6";

  if (!href) {
    return <div className={cardClassName}>{content}</div>;
  }

  return (
    <Link href={href} className={cardClassName}>
      {content}
    </Link>
  );
}
