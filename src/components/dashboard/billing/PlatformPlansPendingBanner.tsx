"use client";

import { Clock3 } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";

interface PlatformPlansPendingBannerProps {
  className?: string;
  /** admin de entidad vs organizador (mismo copy por defecto). */
  audience?: "organizer" | "admin";
}

/**
 * Aviso profesional cuando el superadmin aún no publicó planes.
 * El dashboard sigue usable; las acciones de plan fallan con mensaje claro.
 */
export function PlatformPlansPendingBanner({
  className,
  audience = "organizer",
}: PlatformPlansPendingBannerProps) {
  const t = useTranslations();

  return (
    <div
      role="status"
      className={cn(
        "mb-4 flex items-start gap-3 rounded-2xl border border-sky-200/70 bg-sky-50/80 p-4 dark:border-sky-900/40 dark:bg-sky-950/25",
        className,
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300">
        <Clock3 className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          {t("billing.organizer.plansPendingTitle")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {audience === "admin"
            ? t("billing.organizer.plansPendingBodyAdmin")
            : t("billing.organizer.plansPendingBodyOrganizer")}
        </p>
      </div>
    </div>
  );
}
