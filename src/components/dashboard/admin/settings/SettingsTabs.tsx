"use client";

import { Building, Server } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { SettingsTabsProps } from "./types";
import { useSettingsTabsState } from "./useSettingsTabsState";
import { SettingsSubNav } from "./SettingsSubNav";
import { SettingsTabContent } from "./SettingsTabContent";

export function SettingsTabs({
  isSuperAdmin,
  entityContext,
  initialPlatformSettings,
  platformDefaultAccent: platformDefaultAccentProp,
  adminUser,
  corporateEmail,
}: SettingsTabsProps) {
  const t = useTranslations();
  const state = useSettingsTabsState({
    isSuperAdmin,
    entityContext,
    initialPlatformSettings,
    platformDefaultAccent: platformDefaultAccentProp,
    adminUser,
  });

  const {
    locale,
    section,
    setSection,
    showEntity,
    showPlatform,
    activeSubTab,
    setActiveSubTab,
  } = state;

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      {showEntity && showPlatform && (
        <div className="flex flex-wrap gap-2 p-1 rounded-xl border border-border bg-muted/30 w-fit max-w-full">
          <button
            type="button"
            onClick={() => setSection("entity")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              section === "entity"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building className="h-4 w-4" />
            {t("dashboard.admin.settingsSectionEntity")}
          </button>
          <button
            type="button"
            onClick={() => setSection("platform")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              section === "platform"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Server className="h-4 w-4" />
            {t("dashboard.admin.settingsSectionPlatform")}
          </button>
        </div>
      )}

      {section === "platform" && showPlatform && (
        <p className="text-xs text-muted-foreground rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 w-full min-w-0">
          {locale === "en"
            ? "Platform settings affect all tenants (emails, PDFs, global branding). Only super administrators can save changes."
            : "La configuración de plataforma afecta a todos los inquilinos (correos, PDFs, marca global). Solo los superadministradores pueden guardar cambios."}
        </p>
      )}

      <div className="grid w-full min-w-0 max-w-full gap-8 lg:grid-cols-[250px_minmax(0,1fr)] items-start">
        <SettingsSubNav
          section={section}
          activeSubTab={activeSubTab}
          locale={locale}
          onSelectSubTab={setActiveSubTab}
        />

        <SettingsTabContent
          state={state}
          entityContext={entityContext}
          initialPlatformSettings={initialPlatformSettings}
          adminUser={adminUser}
          corporateEmail={corporateEmail}
        />
      </div>
    </div>
  );
}
