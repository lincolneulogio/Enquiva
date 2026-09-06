import { cn } from "@/lib/utils";

interface RevenueStatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  accentBg: string;
}

export function RevenueStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  accentBg,
}: RevenueStatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-border/80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", accentBg)}>
          <Icon className={cn("h-5 w-5", accent)} />
        </div>
      </div>
    </div>
  );
}
