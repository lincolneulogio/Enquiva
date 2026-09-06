"use client";

import { useState, useEffect } from "react";
import {
  normalizePlatformLocale,
  normalizePlatformTimezone,
  DEFAULT_PLATFORM_TIMEZONE,
  formatDateTimeInTimezone,
} from "@/lib/settings/platform-locale";
import type { Locale } from "@/lib/i18n/core";
import type { SettingsTabsProps } from "./types";

export function usePlatformLocaleClockState({
  initialPlatformSettings,
  locale,
}: {
  initialPlatformSettings?: SettingsTabsProps["initialPlatformSettings"];
  locale: Locale;
}) {
  const [platformLocaleDraft, setPlatformLocaleDraft] = useState<Locale>(
    normalizePlatformLocale(initialPlatformSettings?.defaultLocale),
  );
  const [platformTimezoneDraft, setPlatformTimezoneDraft] = useState(
    normalizePlatformTimezone(initialPlatformSettings?.defaultTimezone ?? DEFAULT_PLATFORM_TIMEZONE),
  );
  const [previewClock, setPreviewClock] = useState<string>("");

  useEffect(() => {
    const updateClock = () => {
      try {
        setPreviewClock(
          formatDateTimeInTimezone(new Date(), {
            timeZone: platformTimezoneDraft,
            locale,
            dateStyle: "full",
            timeStyle: "medium",
          }),
        );
      } catch {
        setPreviewClock("");
      }
    };
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, [platformTimezoneDraft, locale]);

  const syncLocaleTimezone = (settings: typeof initialPlatformSettings) => {
    if (!settings) return;
    setPlatformLocaleDraft(normalizePlatformLocale(settings.defaultLocale));
    setPlatformTimezoneDraft(normalizePlatformTimezone(settings.defaultTimezone));
  };

  return {
    platformLocaleDraft,
    setPlatformLocaleDraft,
    platformTimezoneDraft,
    setPlatformTimezoneDraft,
    previewClock,
    syncLocaleTimezone,
  };
}
