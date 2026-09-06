"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { enUS as enLocale, es as esLocale } from "date-fns/locale";
import { toast } from "sonner";
import { Laptop, Loader2, LogOut, Monitor, ShieldCheck, Smartphone, Tablet } from "lucide-react";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { confirmDeleteAction } from "@/lib/ui/confirm";
import { cn } from "@/lib/utils";
import {
  getActiveSessionsAction,
  revokeOtherSessionsAction,
  revokeSessionAction,
} from "@/actions/profile/sessions";
import type { ActiveSession } from "@/lib/auth/sessions";

const DATE_LOCALES = { es: esLocale, en: enLocale } as const;

const deviceIcons = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: Laptop,
} as const;

export interface ActiveSessionsCardProps {
  initialSessions?: ActiveSession[];
}

export function ActiveSessionsCard({ initialSessions }: ActiveSessionsCardProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [sessions, setSessions] = useState<ActiveSession[] | null>(initialSessions ?? null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loading = sessions === null;

  useEffect(() => {
    if (sessions !== null) return;
    let cancelled = false;
    getActiveSessionsAction()
      .then((data) => {
        if (!cancelled) setSessions(data);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : t("profile.sessions.loadError"));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [sessions, t]);

  const formatSessionDate = (date: Date) =>
    format(
      new Date(date),
      locale === "en" ? "MMM d, yyyy 'at' HH:mm" : "d MMM yyyy 'a las' HH:mm",
      { locale: DATE_LOCALES[locale] },
    );

  const handleRevoke = (session: ActiveSession) => {
    const confirm = () =>
      confirmDeleteAction({
        title: t("profile.sessions.confirmSingleTitle"),
        text: t("profile.sessions.confirmSingleText"),
        confirmText: t("profile.sessions.confirmSingleConfirm"),
        cancelText: t("common.cancel"),
        tone: "danger",
      });

    confirm().then((ok) => {
      if (!ok) return;
      setPendingToken(session.token);
      startTransition(async () => {
        try {
          const updated = await revokeSessionAction(session.token);
          setSessions(updated);
          toast.success(t("profile.sessions.revokeSingleSuccess"));
        } catch (error) {
          toast.error(error instanceof Error ? error.message : t("profile.sessions.revokeError"));
        } finally {
          setPendingToken(null);
        }
      });
    });
  };

  const handleRevokeOthers = () => {
    const confirm = () =>
      confirmDeleteAction({
        title: t("profile.sessions.confirmOthersTitle"),
        text: t("profile.sessions.confirmOthersText"),
        confirmText: t("profile.sessions.confirmOthersConfirm"),
        cancelText: t("common.cancel"),
        tone: "warning",
      });

    confirm().then((ok) => {
      if (!ok) return;
      startTransition(async () => {
        try {
          const updated = await revokeOtherSessionsAction();
          setSessions(updated);
          toast.success(t("profile.sessions.revokeOthersSuccess"));
        } catch (error) {
          toast.error(error instanceof Error ? error.message : t("profile.sessions.revokeError"));
        }
      });
    });
  };

  const othersCount = sessions ? sessions.filter((s) => !s.isCurrent).length : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">{t("profile.sessions.title")}</h3>
            {sessions !== null ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {othersCount}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{t("profile.sessions.subtitle")}</p>
        </div>

        <button
          type="button"
          disabled={isPending || othersCount === 0}
          onClick={handleRevokeOthers}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
          {t("profile.sessions.closeOthers")}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">{t("profile.sessions.loading")}</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/40 py-6 text-xs text-muted-foreground">
          {t("profile.sessions.empty")}
        </div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => {
            const Icon = deviceIcons[session.device.deviceType] ?? Laptop;
            const deviceLabel = session.device.browser ?? t("profile.sessions.unknownBrowser");
            const osLabel = session.device.os ?? t("profile.sessions.unknownOs");
            const pending = pendingToken === session.token;

            return (
              <li
                key={session.token}
                className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    session.isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium text-foreground">
                    {deviceLabel}
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{osLabel}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t(`profile.sessions.deviceType.${session.device.deviceType}`)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("profile.sessions.signedInAt")} {formatSessionDate(session.createdAt)}
                    {" · "}
                    {session.ip.kind === "none" || session.ip.kind === "unspecified" ? (
                      t("profile.sessions.ipUnknown")
                    ) : (
                      <span className="font-medium text-foreground/70">{session.ip.normalized}</span>
                    )}
                  </p>
                </div>

                {session.isCurrent ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t("profile.sessions.current")}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleRevoke(session)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                    aria-label={`${t("profile.sessions.closeOthers")}: ${deviceLabel}`}
                  >
                    {pending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <LogOut className="h-3.5 w-3.5" />
                    )}
                    {t("profile.sessions.closeSession")}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}