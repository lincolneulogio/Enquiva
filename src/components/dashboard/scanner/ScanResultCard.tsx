"use client";

import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Calendar,
  Clock,
} from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { ScanResultData } from "./types";

interface ScanResultCardProps {
  result: ScanResultData;
  locale: string;
  onReset: () => void;
}

export function ScanResultCard({
  result,
  locale,
  onReset,
}: ScanResultCardProps) {
  const t = useTranslations();

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {result.success && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-emerald-600">{t("scanner.accessGranted")}</h3>
            <p className="text-xs text-muted-foreground">{t("scanner.accessGrantedHelp")}</p>
          </div>

          <div className="border-t border-border/60 pt-4 text-left space-y-2.5 text-sm">
            {result.event && (
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{result.event.title}</span>
              </div>
            )}
            {result.ticket && (
              <div className="flex items-center justify-between text-xs text-muted-foreground bg-background/50 p-2 rounded-lg border">
                <span>{t("scanner.ticketCode")}</span>
                <span className="font-mono font-bold text-foreground">{result.ticket.code}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {!result.success &&
        (result.error === "Ticket not valid" || result.ticket?.status === "used") && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertTriangle className="h-9 w-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-amber-600">{t("scanner.ticketUsed")}</h3>
              <p className="text-xs text-muted-foreground">{t("scanner.ticketUsedHelp")}</p>
            </div>

            <div className="border-t border-border/60 pt-4 text-left space-y-2.5 text-sm">
              {result.ticket?.checkedInAt && (
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>
                    {t("scanner.firstCheckin", {
                      time: new Date(result.ticket.checkedInAt).toLocaleString(
                        locale === "en" ? "en-US" : "es-PE",
                        { dateStyle: "short", timeStyle: "medium" },
                      ),
                    })}
                  </span>
                </div>
              )}
              {result.ticket && (
                <div className="flex items-center justify-between text-xs text-muted-foreground bg-background/50 p-2 rounded-lg border">
                  <span>{t("scanner.ticketCode")}</span>
                  <span className="font-mono font-bold text-foreground">{result.ticket.code}</span>
                </div>
              )}
            </div>
          </div>
        )}

      {!result.success &&
        result.error !== "Ticket not valid" &&
        result.ticket?.status !== "used" && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <XCircle className="h-9 w-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-destructive">{t("scanner.accessDenied")}</h3>
              <p className="text-xs text-muted-foreground">{t("scanner.accessDeniedHelp")}</p>
            </div>

            <div className="border-t border-border/60 pt-4 text-left p-3 bg-destructive/5 rounded-xl border border-destructive/10">
              <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1">
                {t("scanner.errorDetail")}
              </p>
              <p className="text-sm font-medium text-foreground">
                {result.error || t("scanner.accessDeniedHelp")}
              </p>
            </div>
          </div>
        )}

      <button
        type="button"
        onClick={onReset}
        className="fe-btn-glow inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all duration-300 cursor-pointer"
      >
        <RefreshCw className="h-4 w-4" />
        {t("scanner.scanAnother")}
      </button>
    </div>
  );
}
