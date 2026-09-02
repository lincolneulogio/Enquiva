"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  approveOrganizerRequest,
  promoteOrgMember,
  rejectOrganizerRequest,
} from "@/actions/organizations";
import {
  Copy,
  Users,
  KeyRound,
  UserPlus,
  Link as LinkIcon,
  Check,
  Building2,
  CheckCircle2,
  Briefcase,
  UserRound,
  Crown,
  ShieldCheck,
} from "lucide-react";
import { getRoleLabel } from "@/lib/i18n/core";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { InviteCodeShareButtons } from "@/components/dashboard/admin/InviteCodeShareButtons";
import { ROLE_BADGE_STYLES, normalizeRole } from "@/lib/auth/rbac";
import { getRegisterInviteUrl } from "@/lib/share/invite-code";
import type { Organization } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface TeamRow {
  member: { role: string; status?: string };
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
  pendingRequests: TeamRow[];
  isOwner: boolean;
}

export function AdminTeamPanel({
  organization,
  team,
  pendingRequests,
  isOwner,
}: AdminTeamPanelProps) {
  const { locale } = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(organization.inviteCode);
    setCopiedCode(true);
    toast.success(t("dashboard.admin.inviteCodeCopied"));
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "https://enquiva.site");
    const link = getRegisterInviteUrl(appUrl, organization.inviteCode);
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success(locale === "en" ? "Invite link copied to clipboard!" : "¡Enlace de invitación copiado al portapapeles!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const changeRole = (userId: string, role: "organizer" | "member") => {
    startTransition(async () => {
      try {
        await promoteOrgMember(userId, role);
        toast.success(t("dashboard.admin.roleUpdatedTo", { role: getRoleLabel(role, locale) }));
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("dashboard.admin.failedToUpdateRole"));
      }
    });
  };

  const approveRequest = (userId: string) => {
    startTransition(async () => {
      try {
        await approveOrganizerRequest(userId);
        toast.success(t("dashboard.admin.organizerRequestApproved"));
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("dashboard.admin.failedToApproveRequest"));
      }
    });
  };

  const rejectRequest = (userId: string) => {
    startTransition(async () => {
      try {
        await rejectOrganizerRequest(userId);
        toast.success(t("dashboard.admin.organizerRequestRejected"));
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("dashboard.admin.failedToRejectRequest"));
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Tarjeta Principal de la Entidad y Código de Invitación */}
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-xs space-y-6">
        {/* Cabecera de la Entidad */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-foreground leading-snug truncate">{organization.name}</h2>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">{t("dashboard.admin.entityTeamIntro")}</p>
          </div>
        </div>

        {/* Hero Box del Código de Invitación */}
        <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 sm:p-5 space-y-4 shadow-xs">
          {/* Título y Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <span className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide">
                {t("dashboard.admin.inviteCodeLabel")}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {locale === "en" ? "Active" : "Activo"}
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("dashboard.admin.inviteCodeHelp")}
          </p>

          {/* Caja destacada con el código y botones de acción */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/90 p-3.5 sm:p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-primary selection:bg-primary/20">
                {organization.inviteCode}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyCode}
                className="flex-1 sm:flex-none inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs sm:text-sm font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/95 active:scale-95"
              >
                {copiedCode ? <Check className="h-4 w-4 text-primary-foreground" /> : <Copy className="h-4 w-4" />}
                <span>{copiedCode ? (locale === "en" ? "Copied!" : "¡Copiado!") : t("dashboard.admin.copyInviteCode")}</span>
              </button>

              <button
                type="button"
                onClick={copyLink}
                title={locale === "en" ? "Copy Direct Link" : "Copiar enlace directo"}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/40 px-3 text-xs sm:text-sm font-semibold text-foreground transition-all hover:bg-secondary active:scale-95"
              >
                {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <LinkIcon className="h-4 w-4" />}
                <span className="hidden xs:inline">{copiedLink ? (locale === "en" ? "Link Copied!" : "¡Enlace Copiado!") : (locale === "en" ? "Link" : "Enlace")}</span>
              </button>
            </div>
          </div>

          {/* Canales de Compartir */}
          <div className="border-t border-border/50 pt-3">
            <InviteCodeShareButtons inviteCode={organization.inviteCode} entityName={organization.name} />
          </div>
        </div>
      </div>

      {/* Solicitudes pendientes (visible para administradores/dueños) */}
      {isOwner && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <UserPlus className="h-5 w-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {t("dashboard.admin.pendingOrganizerRequests")}
              </h3>
            </div>
            {pendingRequests.length > 0 && (
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                {pendingRequests.length} {pendingRequests.length === 1 ? (locale === "en" ? "pending" : "pendiente") : (locale === "en" ? "pending" : "pendientes")}
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("dashboard.admin.pendingOrganizerIntro")}
          </p>

          {pendingRequests.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-amber-500/30 bg-background/50 p-4 text-xs sm:text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{t("dashboard.admin.noPendingRequests")}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map(({ user }) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 font-bold text-sm">
                      {user.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => approveRequest(user.id)}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{t("dashboard.admin.approveRequest")}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => rejectRequest(user.id)}
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-semibold text-rose-700 dark:text-rose-400 transition-all hover:bg-rose-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {t("dashboard.admin.rejectRequest")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Miembros del Equipo */}
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
            const isOwnerRow = user.id === organization.ownerId;
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
                      onClick={() => changeRole(user.id, "organizer")}
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
                      onClick={() => changeRole(user.id, "member")}
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
    </div>
  );
}
