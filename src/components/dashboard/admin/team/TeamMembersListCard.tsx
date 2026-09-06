"use client";

import { Crown, Briefcase, UserRound, Users } from "lucide-react";
import { useTranslations, useLocale } from "@/components/providers/LocaleProvider";
import { getRoleLabel } from "@/lib/i18n/core";
import { ROLE_BADGE_STYLES, normalizeRole } from "@/lib/auth/rbac";
import { cn } from "@/lib/utils";
import type { TeamRow } from "./types";

interface TeamMembersListCardProps {
  team: TeamRow[];
  ownerId: string;
  isOwner: boolean;
  isPending: boolean;
  onChangeRole: (userId: string, role: "organizer" | "member") => void;
}

export function TeamMembersListCard({
  team,
  ownerId,
  isOwner,
  isPending,
  onChangeRole,
}: TeamMembersListCardProps) {
  const { locale } = useLocale();
  const t = useTranslations();

  return (
    <div className="rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            {t("dashboard.admin.teamMembers")}
          </h3>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground border border-border/60">
          {team.length} {team.length === 1 ? (locale === "en" ? "member" : "miembro") : (locale === "en" ? "members" : "miembros")}
        </span>
      </div>

      <div className="space-y-3">
        {team.map(({ member, user }) => {
          const isOwnerRow = user.id === ownerId;
          const normalizedMemberRole = member.role === "owner" ? "admin" : (member.role as "admin" | "organizer" | "member");
          const roleStyle = ROLE_BADGE_STYLES[normalizeRole(normalizedMemberRole)];

          return (
            <div
              key={user.id}
              className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-secondary/20 p-4 sm:flex-row sm:items-center sm:justify-between transition-all hover:border-primary/30"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/20">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-foreground truncate">{user.name}</p>
                    {isOwnerRow && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                        <Crown className="h-2.5 w-2.5" />
                        {t("dashboard.admin.entityOwner")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <div className="mt-1">
                    <span className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold", roleStyle)}>
                      {getRoleLabel(normalizedMemberRole, locale)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones de cambio de rol */}
              {isOwner && !isOwnerRow && (
                <div className="flex items-center gap-2 self-end sm:self-auto pt-1 sm:pt-0">
                  <button
                    type="button"
                    disabled={isPending || member.role === "organizer"}
                    onClick={() => onChangeRole(user.id, "organizer")}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold transition-all disabled:opacity-40",
                      member.role === "organizer"
                        ? "bg-secondary text-muted-foreground"
                        : "bg-background text-foreground hover:bg-secondary active:scale-95"
                    )}
                  >
                    <Briefcase className="h-3 w-3 text-primary" />
                    <span>{t("dashboard.admin.makeOrganizer")}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isPending || member.role === "member"}
                    onClick={() => onChangeRole(user.id, "member")}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold transition-all disabled:opacity-40",
                      member.role === "member"
                        ? "bg-secondary text-muted-foreground"
                        : "bg-background text-foreground hover:bg-secondary active:scale-95"
                    )}
                  >
                    <UserRound className="h-3 w-3 text-muted-foreground" />
                    <span>{t("dashboard.admin.makeMember")}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
