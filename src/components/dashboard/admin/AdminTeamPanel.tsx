"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { promoteOrgMember } from "@/actions/organizations";
import { Copy, Users, KeyRound } from "lucide-react";
import { getRoleLabel } from "@/lib/i18n/core";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { InviteCodeShareButtons } from "@/components/dashboard/admin/InviteCodeShareButtons";
import type { Organization } from "@/lib/db/schema";

interface TeamRow {
  member: { role: string };
  user: {
    id: string;
    name: string;
    email: string;
    role: string | null;
    createdAt: Date;
  };
}

interface AdminTeamPanelProps {
  organization: Organization;
  team: TeamRow[];
  isOwner: boolean;
}

export function AdminTeamPanel({ organization, team, isOwner }: AdminTeamPanelProps) {
  const { locale } = useLocale();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  const copyCode = () => {
    navigator.clipboard.writeText(organization.inviteCode);
    toast.success(t("dashboard.admin.inviteCodeCopied"));
  };

  const changeRole = (userId: string, role: "organizer" | "member") => {
    startTransition(async () => {
      try {
        await promoteOrgMember(userId, role);
        toast.success(t("dashboard.admin.roleUpdatedTo", { role: getRoleLabel(role, locale) }));
        window.location.reload();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("dashboard.admin.failedToUpdateRole"));
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">{organization.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.admin.entityTeamIntro")}</p>

        <div className="mt-4 space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <KeyRound className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">{t("dashboard.admin.inviteCodeLabel")}</p>
              <p className="font-mono text-lg font-bold tracking-widest text-foreground">{organization.inviteCode}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("dashboard.admin.inviteCodeHelp")}</p>
            </div>
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              <Copy className="h-4 w-4" />
              {t("dashboard.admin.copyInviteCode")}
            </button>
          </div>
          <InviteCodeShareButtons inviteCode={organization.inviteCode} entityName={organization.name} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t("dashboard.admin.teamMembers")}</h3>
        </div>

        <div className="space-y-3">
          {team.map(({ member, user }) => {
            const isOwnerRow = user.id === organization.ownerId;
            return (
              <div
                key={user.id}
                className="flex flex-col gap-2 rounded-xl border border-border bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {user.name}
                    {isOwnerRow && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                        {t("dashboard.admin.entityOwner")}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getRoleLabel((user.role ?? "member") as "member", locale)}
                  </p>
                </div>
                {isOwner && !isOwnerRow && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isPending || user.role === "organizer"}
                      onClick={() => changeRole(user.id, "organizer")}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                    >
                      {t("dashboard.admin.makeOrganizer")}
                    </button>
                    <button
                      type="button"
                      disabled={isPending || user.role === "member"}
                      onClick={() => changeRole(user.id, "member")}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                    >
                      {t("dashboard.admin.makeMember")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
