"use client";

import {
  type AccentColor,
  DEFAULT_ACCENT_COLOR,
} from "@/components/dashboard/admin/AccentColorInitializer";
import { PersonalAppearancePreferences } from "@/components/dashboard/appearance/PersonalAppearancePreferences";
import type { SystemSettings } from "@/lib/settings";
import { PlatformAccentSection } from "./PlatformAccentSection";
import { PlatformLanguageTimezoneSection } from "./PlatformLanguageTimezoneSection";

export interface PlatformAppearanceLocaleProps {
  locale: "es" | "en";
  initialPlatformSettings: SystemSettings;
  platformAccentDraft: AccentColor;
  setPlatformAccentDraft: (val: AccentColor) => void;
  platformDefaultAccent?: AccentColor;
  platformLocaleDraft: "es" | "en";
  setPlatformLocaleDraft: (val: "es" | "en") => void;
  platformTimezoneDraft: string;
  setPlatformTimezoneDraft: (val: string) => void;
  previewClock: string;
  isSaving: boolean;
  handleSavePlatformAccent: () => void;
  handleSavePlatformLocaleTimezone: () => void;
}

export function PlatformAppearanceLocale({
  locale,
  initialPlatformSettings,
  platformAccentDraft,
  setPlatformAccentDraft,
  platformDefaultAccent,
  platformLocaleDraft,
  setPlatformLocaleDraft,
  platformTimezoneDraft,
  setPlatformTimezoneDraft,
  previewClock,
  isSaving,
  handleSavePlatformAccent,
  handleSavePlatformLocaleTimezone,
}: PlatformAppearanceLocaleProps) {
  return (
    <>
      <PlatformAccentSection
        locale={locale}
        platformAccentDraft={platformAccentDraft}
        setPlatformAccentDraft={setPlatformAccentDraft}
        platformDefaultAccent={platformDefaultAccent}
        isSaving={isSaving}
        onSave={handleSavePlatformAccent}
      />

      <PlatformLanguageTimezoneSection
        locale={locale}
        initialPlatformSettings={initialPlatformSettings}
        platformLocaleDraft={platformLocaleDraft}
        setPlatformLocaleDraft={setPlatformLocaleDraft}
        platformTimezoneDraft={platformTimezoneDraft}
        setPlatformTimezoneDraft={setPlatformTimezoneDraft}
        previewClock={previewClock}
        isSaving={isSaving}
        onSave={handleSavePlatformLocaleTimezone}
      />

      {/* Personal Appearance */}
      <PersonalAppearancePreferences
        platformDefaultAccent={platformDefaultAccent ?? DEFAULT_ACCENT_COLOR}
      />
    </>
  );
}
