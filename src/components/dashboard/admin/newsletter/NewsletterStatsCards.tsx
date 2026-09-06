import { Users, UserCheck, UserX } from "lucide-react";
import type { NewsletterStats } from "@/actions/admin/newsletter";

interface NewsletterStatsCardsProps {
  stats: NewsletterStats;
}

export function NewsletterStatsCards({ stats }: NewsletterStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Suscriptores
          </span>
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold text-foreground">
            {stats.total}
          </span>
          <span className="text-xs text-muted-foreground">registrados</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Suscriptores Activos
          </span>
          <div className="p-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold text-green-600 dark:text-green-400">
            {stats.active}
          </span>
          <span className="text-xs text-muted-foreground">reciben correos</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Bajas / Desuscritos
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <UserX className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold text-amber-600 dark:text-amber-400">
            {stats.unsubscribed}
          </span>
          <span className="text-xs text-muted-foreground">inactivos</span>
        </div>
      </div>
    </div>
  );
}
