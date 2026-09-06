"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/providers/LocaleProvider";
import { toast } from "sonner";
import { usePersistedFormFields } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { saveSystemSettingsAction } from "@/actions/admin/settings";
import {
  DEFAULT_ACCENT_COLOR,
  isAccentColor,
  clearAccentOverride,
  hasAccentOverride,
  type AccentColor,
} from "@/components/dashboard/admin/AccentColorInitializer";
import type { SettingsTabsProps, EntitySubTab, PlatformSubTab, SettingsSection } from "./types";
import { useSpotlightBannerState } from "./useSpotlightBannerState";
import { useMaintenanceAnnouncementState } from "./useMaintenanceAnnouncementState";
import { usePlatformLocaleClockState } from "./usePlatformLocaleClockState";
import { executeSavePlatformOps } from "./settings-save-actions";

export function useSettingsTabsState({
  isSuperAdmin,
  entityContext,
  initialPlatformSettings,
  platformDefaultAccent: platformDefaultAccentProp,
}: SettingsTabsProps) {
  const { locale, setLocale } = useLocale();
  const router = useRouter();

  const showEntity = Boolean(entityContext);
  const showPlatform = isSuperAdmin && Boolean(initialPlatformSettings);
  const defaultSection: SettingsSection =
    showEntity && !showPlatform ? "entity" : showPlatform && !showEntity ? "platform" : "entity";

  const [section, setSection] = useState<SettingsSection>(defaultSection);
  const [entitySubTab, setEntitySubTab] = useState<EntitySubTab>("profile");
  const [platformSubTab, setPlatformSubTab] = useState<PlatformSubTab>("identity");

  const { values: settingsDraft, setValue: setSettingsValue } = usePersistedFormFields(
    formStorageKey("admin.settings.v2"),
    {
      entityName: entityContext?.name ?? "",
      platformOrgName: initialPlatformSettings?.organizationName ?? "",
      pushNotificationTitle: initialPlatformSettings?.pushNotificationTitle ?? "",
      alertPayments: initialPlatformSettings?.alertNewPayments ?? true,
      alertRegistrations: initialPlatformSettings?.alertNewRegistrations ?? true,
      alertTransport: initialPlatformSettings?.alertTransportCapacity ?? true,
      alertOrganizerRequests: initialPlatformSettings?.alertOrganizerRequests ?? true,
      alertEventPublished: initialPlatformSettings?.alertEventPublished ?? true,
      alertSubscriptionPastDue: initialPlatformSettings?.alertSubscriptionPastDue ?? true,
      alertFinance: initialPlatformSettings?.alertDailyFinanceSummary ?? false,
    },
  );

  const [isSaving, startSaving] = useTransition();

  const platformDefaultAccent: AccentColor = isAccentColor(platformDefaultAccentProp)
    ? platformDefaultAccentProp
    : isAccentColor(initialPlatformSettings?.defaultAccentColor)
      ? initialPlatformSettings!.defaultAccentColor
      : DEFAULT_ACCENT_COLOR;

  const [platformAccentDraft, setPlatformAccentDraft] = useState<AccentColor>(platformDefaultAccent);

  useEffect(() => {
    setPlatformAccentDraft(platformDefaultAccent);
  }, [platformDefaultAccent]);

  const spotlight = useSpotlightBannerState({ isSuperAdmin, initialPlatformSettings });
  const maintenance = useMaintenanceAnnouncementState({ initialPlatformSettings });
  const localeClock = usePlatformLocaleClockState({ initialPlatformSettings, locale: locale as any });

  useEffect(() => {
    if (!initialPlatformSettings) return;
    maintenance.syncMaintenanceAnnouncementSettings(initialPlatformSettings);
    spotlight.syncSpotlightSettings(initialPlatformSettings);
    localeClock.syncLocaleTimezone(initialPlatformSettings);
  }, [initialPlatformSettings]);

  const handleSavePlatformAccent = () => {
    startSaving(async () => {
      try {
        const res = await saveSystemSettingsAction({ defaultAccentColor: platformAccentDraft });
        if (res.success) {
          if (!hasAccentOverride()) clearAccentOverride(platformAccentDraft);
          toast.success(
            locale === "en" ? "Platform default accent saved" : "Color de acento por defecto guardado",
          );
          router.refresh();
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  };

  const handleSavePlatformLocaleTimezone = () => {
    startSaving(async () => {
      try {
        const res = await saveSystemSettingsAction({
          defaultLocale: localeClock.platformLocaleDraft,
          defaultTimezone: localeClock.platformTimezoneDraft,
        });
        if (res.success) {
          if (localeClock.platformLocaleDraft !== locale) setLocale(localeClock.platformLocaleDraft);
          toast.success(
            locale === "en"
              ? "Default language & timezone saved"
              : "Idioma y zona horaria por defecto guardados",
          );
          router.refresh();
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  };

  const handleSavePlatformOps = () => {
    startSaving(async () => {
      const ok = await executeSavePlatformOps({
        maintenance,
        spotlight,
        timezoneDraft: localeClock.platformTimezoneDraft,
        defaultTimezone: initialPlatformSettings?.defaultTimezone,
        locale,
      });
      if (ok) router.refresh();
    });
  };

  const handleSaveNotifications = () => {
    startSaving(async () => {
      try {
        const res = await saveSystemSettingsAction({
          pushNotificationTitle: (settingsDraft.pushNotificationTitle ?? "").trim().slice(0, 64),
          alertNewPayments: settingsDraft.alertPayments,
          alertNewRegistrations: settingsDraft.alertRegistrations,
          alertTransportCapacity: settingsDraft.alertTransport,
          alertOrganizerRequests: settingsDraft.alertOrganizerRequests,
          alertEventPublished: settingsDraft.alertEventPublished,
          alertSubscriptionPastDue: settingsDraft.alertSubscriptionPastDue,
          alertDailyFinanceSummary: settingsDraft.alertFinance,
        });
        if (res.success) {
          toast.success(
            locale === "en"
              ? "Push branding and system alerts updated"
              : "Marca push y alertas del sistema actualizadas",
          );
          router.refresh();
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  };

  const activeSubTab = section === "entity" ? entitySubTab : platformSubTab;
  const setActiveSubTab = (id: string) => {
    if (section === "entity") setEntitySubTab(id as EntitySubTab);
    else setPlatformSubTab(id as PlatformSubTab);
  };

  return {
    locale,
    section,
    setSection,
    entitySubTab,
    platformSubTab,
    showEntity,
    showPlatform,
    activeSubTab,
    setActiveSubTab,
    settingsDraft,
    setSettingsValue,
    ...settingsDraft,
    isSaving,
    platformDefaultAccent,
    platformAccentDraft,
    setPlatformAccentDraft,
    ...maintenance,
    ...spotlight,
    ...localeClock,
    handleSavePlatformAccent,
    handleSavePlatformLocaleTimezone,
    handleSavePlatformOps,
    handleSaveNotifications,
  };
}
