"use client";

import { useState } from "react";
import type { AnnouncementSeverity } from "@/lib/settings/platform-ops";
import { normalizePlatformTimezone } from "@/lib/settings/platform-locale";
import { toDatetimeLocalValue } from "@/lib/datetime/zoned-day";
import type { SettingsTabsProps } from "./types";

export function useMaintenanceAnnouncementState({
  initialPlatformSettings,
}: Pick<SettingsTabsProps, "initialPlatformSettings">) {
  const [maintenanceMode, setMaintenanceMode] = useState(
    initialPlatformSettings?.maintenanceMode ?? false,
  );
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    initialPlatformSettings?.maintenanceMessage ?? "",
  );
  const [maintenanceStartsLocal, setMaintenanceStartsLocal] = useState("");
  const [maintenanceEndsLocal, setMaintenanceEndsLocal] = useState("");
  const [announcementEnabled, setAnnouncementEnabled] = useState(
    initialPlatformSettings?.announcementEnabled ?? false,
  );
  const [announcementMessage, setAnnouncementMessage] = useState(
    initialPlatformSettings?.announcementMessage ?? "",
  );
  const [announcementSeverity, setAnnouncementSeverity] = useState<AnnouncementSeverity>(
    initialPlatformSettings?.announcementSeverity ?? "info",
  );
  const [announcementDismissible, setAnnouncementDismissible] = useState(
    initialPlatformSettings?.announcementDismissible ?? true,
  );
  const [announcementStartsLocal, setAnnouncementStartsLocal] = useState("");
  const [announcementEndsLocal, setAnnouncementEndsLocal] = useState("");
  const [announcementEventLocal, setAnnouncementEventLocal] = useState("");

  const syncMaintenanceAnnouncementSettings = (
    settings: typeof initialPlatformSettings,
  ) => {
    if (!settings) return;
    setMaintenanceMode(settings.maintenanceMode);
    setMaintenanceMessage(settings.maintenanceMessage);
    setAnnouncementEnabled(settings.announcementEnabled);
    setAnnouncementMessage(settings.announcementMessage);
    setAnnouncementSeverity(settings.announcementSeverity);
    setAnnouncementDismissible(settings.announcementDismissible);
    const tz = normalizePlatformTimezone(settings.defaultTimezone);
    setMaintenanceStartsLocal(toDatetimeLocalValue(settings.maintenanceStartsAt, tz));
    setMaintenanceEndsLocal(toDatetimeLocalValue(settings.maintenanceEndsAt, tz));
    setAnnouncementStartsLocal(toDatetimeLocalValue(settings.announcementStartsAt, tz));
    setAnnouncementEndsLocal(toDatetimeLocalValue(settings.announcementEndsAt, tz));
    setAnnouncementEventLocal(toDatetimeLocalValue(settings.announcementEventAt, tz));
  };

  return {
    maintenanceMode,
    setMaintenanceMode,
    maintenanceMessage,
    setMaintenanceMessage,
    maintenanceStartsLocal,
    setMaintenanceStartsLocal,
    maintenanceEndsLocal,
    setMaintenanceEndsLocal,
    announcementEnabled,
    setAnnouncementEnabled,
    announcementMessage,
    setAnnouncementMessage,
    announcementSeverity,
    setAnnouncementSeverity,
    announcementDismissible,
    setAnnouncementDismissible,
    announcementStartsLocal,
    setAnnouncementStartsLocal,
    announcementEndsLocal,
    setAnnouncementEndsLocal,
    announcementEventLocal,
    setAnnouncementEventLocal,
    syncMaintenanceAnnouncementSettings,
  };
}
