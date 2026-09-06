"use client";

import {
  User,
  Building,
  Globe,
  Server,
  Palette,
  Sparkles,
  Award,
  Send,
  Bell,
} from "lucide-react";
import type { EntitySubTab, PlatformSubTab, SettingsSection } from "./types";

const ENTITY_NAV: { id: EntitySubTab; icon: typeof User; labelEs: string; labelEn: string }[] = [
  { id: "profile", icon: User, labelEs: "Mi cuenta", labelEn: "My account" },
  { id: "entity", icon: Building, labelEs: "Mi entidad", labelEn: "My entity" },
  { id: "appearance", icon: Globe, labelEs: "Preferencias", labelEn: "Preferences" },
];

const PLATFORM_NAV: { id: PlatformSubTab; icon: typeof Server; labelEs: string; labelEn: string }[] = [
  { id: "identity", icon: Building, labelEs: "Identidad global", labelEn: "Global identity" },
  { id: "preferences", icon: Palette, labelEs: "Preferencias", labelEn: "Preferences" },
  { id: "impact", icon: Sparkles, labelEs: "Métricas de portada", labelEn: "Landing metrics" },
  { id: "certificates", icon: Award, labelEs: "Sello de certificados", labelEn: "Certificate seal" },
  { id: "smtp", icon: Send, labelEs: "Correo SMTP", labelEn: "SMTP mail" },
  { id: "notifications", icon: Bell, labelEs: "Alertas del sistema", labelEn: "System alerts" },
];

interface SettingsSubNavProps {
  section: SettingsSection;
  activeSubTab: string;
  locale: string;
  onSelectSubTab: (id: any) => void;
}

export function SettingsSubNav({
  section,
  activeSubTab,
  locale,
  onSelectSubTab,
}: SettingsSubNavProps) {
  const sideNav = section === "entity" ? ENTITY_NAV : PLATFORM_NAV;

  return (
    <div className="flex w-full min-w-0 max-w-full flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-border select-none whitespace-nowrap scrollbar-none">
      {sideNav.map((item) => {
        const Icon = item.icon;
        const isActive = activeSubTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectSubTab(item.id)}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-left shrink-0 lg:shrink ${
              isActive
                ? "bg-primary/10 text-primary border-l-2 border-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {locale === "en" ? item.labelEn : item.labelEs}
          </button>
        );
      })}
    </div>
  );
}
