"use client";

import Link from "next/link";
import { Copy, KeyRound, Users } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { InviteCodeShareButtons } from "@/components/dashboard/admin/InviteCodeShareButtons";

interface EntityInviteBannerProps {
  inviteCode: string;
  entityName?: string;
}

export function EntityInviteBanner({ inviteCode, entityName }: EntityInviteBannerProps) {
  const t = useTranslations();

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success(t("dashboard.admin.inviteCodeCopied"));
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {t("dashboard.admin.entityInviteBannerTitle")}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("dashboard.admin.entityInviteBannerIntro")}
            </p>
            <p className="mt-2 font-mono text-lg font-bold tracking-widest text-foreground">
              {inviteCode}
            </p>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 lg:max-w-md">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Copy className="h-4 w-4" />
              {t("dashboard.admin.copyInviteCode")}
            </button>
            <Link
              href="/admin/team"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              <Users className="h-4 w-4" />
              {t("dashboard.admin.entityInviteBannerTeamLink")}
            </Link>
          </div>

          <InviteCodeShareButtons inviteCode={inviteCode} entityName={entityName} compact />
        </div>
      </div>
    </div>
  );
}
