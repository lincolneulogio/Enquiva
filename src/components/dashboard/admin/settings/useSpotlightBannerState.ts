"use client";

import { useState, useEffect } from "react";
import {
  getPublishedEventsForAdminAction,
  getSpotlightPreviewAction,
} from "@/actions/admin/event-spotlight";
import type { EventSpotlightData } from "@/services/events/event-spotlight.service";
import type { SettingsTabsProps } from "./types";

export function useSpotlightBannerState({
  isSuperAdmin,
  initialPlatformSettings,
}: Pick<SettingsTabsProps, "isSuperAdmin" | "initialPlatformSettings">) {
  const [eventBannerEnabled, setEventBannerEnabled] = useState(
    initialPlatformSettings?.eventBannerEnabled ?? false,
  );
  const [eventBannerMode, setEventBannerMode] = useState<"auto" | "pinned">(
    initialPlatformSettings?.eventBannerMode ?? "auto",
  );
  const [eventBannerCriteria, setEventBannerCriteria] = useState<
    "auto" | "upcoming" | "popular" | "few_tickets"
  >(initialPlatformSettings?.eventBannerCriteria ?? "auto");
  const [eventBannerPinnedEventId, setEventBannerPinnedEventId] = useState(
    initialPlatformSettings?.eventBannerPinnedEventId ?? "",
  );
  const [eventBannerCustomBadge, setEventBannerCustomBadge] = useState(
    initialPlatformSettings?.eventBannerCustomBadge ?? "",
  );
  const [eventBannerCustomText, setEventBannerCustomText] = useState(
    initialPlatformSettings?.eventBannerCustomText ?? "",
  );
  const [adminPublishedEvents, setAdminPublishedEvents] = useState<
    Array<{ id: string; title: string; slug: string; date: string }>
  >([]);
  const [spotlightPreview, setSpotlightPreview] = useState<EventSpotlightData | null>(null);
  const [isLoadingSpotlightPreview, setIsLoadingSpotlightPreview] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) return;
    getPublishedEventsForAdminAction()
      .then((list) => setAdminPublishedEvents(list))
      .catch(() => setAdminPublishedEvents([]));
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    setIsLoadingSpotlightPreview(true);
    const timer = setTimeout(() => {
      getSpotlightPreviewAction({
        eventBannerEnabled: true,
        eventBannerMode,
        eventBannerCriteria,
        eventBannerPinnedEventId: eventBannerPinnedEventId || null,
        eventBannerCustomBadge,
        eventBannerCustomText,
      })
        .then((res) => setSpotlightPreview(res))
        .catch(() => setSpotlightPreview(null))
        .finally(() => setIsLoadingSpotlightPreview(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [
    isSuperAdmin,
    eventBannerMode,
    eventBannerCriteria,
    eventBannerPinnedEventId,
    eventBannerCustomBadge,
    eventBannerCustomText,
  ]);

  const syncSpotlightSettings = (settings: typeof initialPlatformSettings) => {
    if (!settings) return;
    setEventBannerEnabled(settings.eventBannerEnabled ?? false);
    setEventBannerMode(settings.eventBannerMode ?? "auto");
    setEventBannerCriteria(settings.eventBannerCriteria ?? "auto");
    setEventBannerPinnedEventId(settings.eventBannerPinnedEventId ?? "");
    setEventBannerCustomBadge(settings.eventBannerCustomBadge ?? "");
    setEventBannerCustomText(settings.eventBannerCustomText ?? "");
  };

  return {
    eventBannerEnabled,
    setEventBannerEnabled,
    eventBannerMode,
    setEventBannerMode,
    eventBannerCriteria,
    setEventBannerCriteria,
    eventBannerPinnedEventId,
    setEventBannerPinnedEventId,
    eventBannerCustomBadge,
    setEventBannerCustomBadge,
    eventBannerCustomText,
    setEventBannerCustomText,
    adminPublishedEvents,
    spotlightPreview,
    isLoadingSpotlightPreview,
    syncSpotlightSettings,
  };
}
