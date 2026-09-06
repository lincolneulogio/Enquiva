import Image from "next/image";
import { Trash2 } from "lucide-react";
import type { PaymentMethod } from "@/lib/db/schema";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { TYPE_ICONS, TYPE_LABELS, type PaymentMethodScope } from "./types";

interface PaymentMethodListProps {
  scope: PaymentMethodScope;
  visibleMethods: PaymentMethod[];
  legacyWalletMethods: PaymentMethod[];
  legacyEventLinkCount: number;
  hasCulqiMethod: boolean;
  planIncludesCulqi: boolean;
  isPending: boolean;
  onEdit: (method: PaymentMethod) => void;
  onRemove: (id: string) => void;
  onDetachLegacy: () => void;
}

export function PaymentMethodList({
  scope,
  visibleMethods,
  legacyWalletMethods,
  legacyEventLinkCount,
  hasCulqiMethod,
  planIncludesCulqi,
  isPending,
  onEdit,
  onRemove,
  onDetachLegacy,
}: PaymentMethodListProps) {
  const t = useTranslations();
  const isPlatform = scope === "platform";

  return (
    <div className="max-w-2xl space-y-3">
      {legacyWalletMethods.length > 0 && (
        <div className="space-y-2 rounded-xl border border-amber-200/60 bg-amber-50/50 px-3 py-3 text-xs text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200">
          <p>
            {isPlatform
              ? t("payments.config.platformLegacyHint")
              : t("payments.config.organizerLegacyHint")}
          </p>
          {!isPlatform && legacyEventLinkCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <p>{t("payments.config.legacyEventLinks", { count: legacyEventLinkCount })}</p>
              <button
                type="button"
                disabled={isPending}
                onClick={onDetachLegacy}
                className="rounded-lg border border-amber-300 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-amber-900 transition-colors hover:bg-white disabled:opacity-50 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
              >
                {t("payments.config.detachLegacyFromEvents")}
              </button>
            </div>
          )}
          {!isPlatform && !hasCulqiMethod && planIncludesCulqi && (
            <p className="font-medium">{t("payments.config.migrateToCulqiBanner")}</p>
          )}
        </div>
      )}

      {visibleMethods.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("payments.config.empty")}</p>
      )}

      {visibleMethods.map((m) => {
        const Icon = TYPE_ICONS[m.type];
        const isLegacy = m.type === "yape" || m.type === "plin";
        return (
          <div key={m.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">{m.label}</p>
                {m.type === "culqi" && (
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                    Instantáneo
                  </span>
                )}
                {isLegacy && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    Legacy
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {TYPE_LABELS[m.type]} · {m.holderName}
                {m.phone ? ` · ${m.phone}` : ""}
              </p>
            </div>
            {m.qrCodeUrl && (
              <Image src={m.qrCodeUrl} alt="QR" width={48} height={48} className="shrink-0 rounded border" />
            )}
            <div className="flex shrink-0 gap-1">
              {!isLegacy && (
                <button
                  type="button"
                  onClick={() => onEdit(m)}
                  className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {t("common.edit")}
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemove(m.id)}
                className="rounded-lg border border-destructive/30 px-3 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
