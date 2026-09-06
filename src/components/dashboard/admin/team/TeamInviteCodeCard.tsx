"use client";

import { Building2, KeyRound, Check, Copy, Link as LinkIcon } from "lucide-react";
import { useTranslations, useLocale } from "@/components/providers/LocaleProvider";
import { InviteCodeShareButtons } from "@/components/dashboard/admin/InviteCodeShareButtons";
import type { Organization } from "@/lib/db/schema";

interface TeamInviteCodeCardProps {
  organization: Organization;
  copiedCode: boolean;
  copiedLink: boolean;
  onCopyCode: () => void;
  onCopyLink: () => void;
}

export function TeamInviteCodeCard({
  organization,
  copiedCode,
  copiedLink,
  onCopyCode,
  onCopyLink,
}: TeamInviteCodeCardProps) {
  const { locale } = useLocale();
  const t = useTranslations();

  return (
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
              onClick={onCopyCode}
              className="flex-1 sm:flex-none inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs sm:text-sm font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/95 active:scale-95"
            >
              {copiedCode ? <Check className="h-4 w-4 text-primary-foreground" /> : <Copy className="h-4 w-4" />}
              <span>{copiedCode ? (locale === "en" ? "Copied!" : "¡Copiado!") : t("dashboard.admin.copyInviteCode")}</span>
            </button>

            <button
              type="button"
              onClick={onCopyLink}
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
  );
}
