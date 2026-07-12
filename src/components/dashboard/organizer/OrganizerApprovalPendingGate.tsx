"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Clock3, Loader2, LogOut, Mail } from "lucide-react";
import { getMyPendingOrganizerRequest } from "@/actions/organizations";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { signOut } from "@/lib/auth/client";

interface OrganizerApprovalPendingGateProps {
  entityName: string;
}

const POLL_MS = 8_000;

/**
 * Pantalla de espera profesional mientras el admin de la entidad aprueba
 * la solicitud de organizador. Hace poll ligero y entra al panel al aprobar.
 */
export function OrganizerApprovalPendingGate({
  entityName,
}: OrganizerApprovalPendingGateProps) {
  const t = useTranslations();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [signingOut, startSignOut] = useTransition();

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    let inFlight = false;

    const schedule = () => {
      if (cancelled) return;
      timer = window.setTimeout(() => {
        void check();
      }, POLL_MS);
    };

    const check = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      setChecking(true);
      try {
        const pending = await getMyPendingOrganizerRequest();
        if (cancelled) return;
        if (!pending) {
          router.replace("/organizer");
          router.refresh();
          return;
        }
      } catch {
        // Reintenta en el siguiente ciclo.
      } finally {
        inFlight = false;
        if (!cancelled) setChecking(false);
      }
      schedule();
    };

    schedule();

    const onFocus = () => {
      if (document.visibilityState === "hidden") return;
      if (timer) window.clearTimeout(timer);
      void check();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [router]);

  const onSignOut = () => {
    startSignOut(async () => {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.replace("/login");
          },
        },
      });
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="organizer-approval-pending-title"
        aria-describedby="organizer-approval-pending-desc"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        <div className="border-b border-border bg-gradient-to-br from-amber-500/10 via-card to-card px-6 py-5">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
              <Clock3 className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                {t("dashboard.organizer.pendingApprovalBadge")}
              </p>
              <h2
                id="organizer-approval-pending-title"
                className="mt-1 font-display text-xl font-semibold text-foreground"
              >
                {t("dashboard.organizer.pendingApprovalModalTitle", {
                  entity: entityName,
                })}
              </h2>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p
            id="organizer-approval-pending-desc"
            className="text-sm leading-relaxed text-muted-foreground"
          >
            {t("dashboard.organizer.pendingApprovalModalBody")}
          </p>

          <div className="space-y-3 rounded-xl border border-border/80 bg-muted/30 p-4">
            <div className="flex items-start gap-3 text-sm text-foreground">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{t("dashboard.organizer.pendingApprovalModalHint")}</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-foreground">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{t("dashboard.organizer.pendingApprovalModalWait")}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            {checking ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{t("dashboard.organizer.pendingApprovalChecking")}</span>
              </>
            ) : (
              <span>{t("dashboard.organizer.pendingApprovalAutoRefresh")}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border bg-muted/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {t("dashboard.organizer.pendingApprovalModalFooter")}
          </p>
          <button
            type="button"
            onClick={onSignOut}
            disabled={signingOut}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {t("common.signOut")}
          </button>
        </div>
      </div>
    </div>
  );
}
