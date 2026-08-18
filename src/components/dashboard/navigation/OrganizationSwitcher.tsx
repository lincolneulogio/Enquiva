"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Building2, Check, ChevronDown, Loader2 } from "lucide-react";
import { switchActiveOrganization, joinOrganizationWithInviteCode } from "@/actions/organizations";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "@/components/providers/LocaleProvider";
import { getRoleLabel } from "@/lib/i18n/core";
import type { ActiveOrganizationMembership } from "@/lib/organizations/active-membership";

interface OrganizationSwitcherProps {
  memberships: ActiveOrganizationMembership[];
  canJoin: boolean;
}

export function OrganizationSwitcher({ memberships, canJoin }: OrganizationSwitcherProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinMessage, setJoinMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement | null>(null);

  const current = memberships.find((item) => item.isCurrent) ?? memberships[0] ?? null;

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (!current && !canJoin) return null;

  const handleSwitch = (organizationId: string, isCurrent: boolean) => {
    if (isCurrent || isPending) return;
    startTransition(async () => {
      await switchActiveOrganization(organizationId);
    });
  };

  const handleJoin = () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code || isPending) return;
    setJoinError(null);
    setJoinMessage(null);
    startTransition(async () => {
      try {
        const result = await joinOrganizationWithInviteCode(code);
        setInviteCode("");
        setJoinMessage(t("dashboard.organizationSwitcher.joinSuccess", { name: result.organizationName }));
      } catch (error) {
        setJoinError(error instanceof Error ? error.message : "Error");
      }
    });
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={isPending}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={t("dashboard.organizationSwitcher.switch")}
        className="inline-flex h-10 max-w-[11rem] items-center gap-2 rounded-xl border border-border bg-secondary/50 px-2.5 text-left transition-colors hover:bg-secondary disabled:opacity-60 sm:max-w-[16rem]"
      >
        <Building2 className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-foreground">
            {current?.organizationName ?? t("dashboard.organizationSwitcher.empty")}
          </span>
          <span className="hidden truncate text-[10px] text-muted-foreground sm:block">
            {current ? getRoleLabel(current.appRole, locale) : t("dashboard.organizationSwitcher.join")}
          </span>
        </span>
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        )}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-background p-2 shadow-xl">
          <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("dashboard.organizationSwitcher.label")}
          </p>
          <ul className="max-h-64 space-y-0.5 overflow-y-auto" role="listbox">
            {memberships.map((membership) => (
              <li key={membership.organizationId}>
                <button
                  type="button"
                  role="option"
                  aria-selected={membership.isCurrent}
                  disabled={isPending}
                  onClick={() => handleSwitch(membership.organizationId, membership.isCurrent)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                    membership.isCurrent
                      ? "bg-primary/10 text-foreground"
                      : "text-foreground hover:bg-secondary/80",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{membership.organizationName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {getRoleLabel(membership.appRole, locale)}
                    </span>
                  </span>
                  {membership.isCurrent ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                </button>
              </li>
            ))}
          </ul>

          {canJoin ? (
            <div className="mt-2 border-t border-border pt-2">
              <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("dashboard.organizationSwitcher.join")}
              </p>
              <div className="flex gap-1.5 px-1">
                <input
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  placeholder={t("dashboard.organizationSwitcher.joinPlaceholder")}
                  className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-secondary/40 px-2.5 text-xs text-foreground outline-none ring-primary/30 focus:ring-2"
                  autoComplete="off"
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={isPending || inviteCode.trim().length < 4}
                  className="h-9 shrink-0 rounded-lg bg-primary px-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {t("dashboard.organizationSwitcher.joinSubmit")}
                </button>
              </div>
              {joinError ? <p className="mt-1.5 px-2 text-xs text-destructive">{joinError}</p> : null}
              {joinMessage ? <p className="mt-1.5 px-2 text-xs text-emerald-600 dark:text-emerald-400">{joinMessage}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
