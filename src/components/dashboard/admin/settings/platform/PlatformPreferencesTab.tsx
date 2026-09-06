"use client";

import React from "react";
import { MaintenanceModeSection } from "./preferences/MaintenanceModeSection";
import { AnnouncementBannerSection } from "./preferences/AnnouncementBannerSection";
import { SpotlightBannerSection } from "./preferences/SpotlightBannerSection";
import { PlatformAppearanceLocale } from "./preferences/PlatformAppearanceLocale";
import type { PlatformPreferencesTabProps } from "./preferences/types";

export type { PlatformPreferencesTabProps };

export function PlatformPreferencesTab({
  locale,
  initialPlatformSettings,
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
  announcementEventLocal,
  setAnnouncementEventLocal,
  announcementStartsLocal,
  setAnnouncementStartsLocal,
  announcementEndsLocal,
  setAnnouncementEndsLocal,
  announcementSeverity,
  setAnnouncementSeverity,
  announcementDismissible,
  setAnnouncementDismissible,
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
  spotlightPreview,
  isLoadingSpotlightPreview,
  adminPublishedEvents,
  platformAccentDraft,
  setPlatformAccentDraft,
  platformDefaultAccent,
  platformLocaleDraft,
  setPlatformLocaleDraft,
  platformTimezoneDraft,
  setPlatformTimezoneDraft,
  previewClock,
  isSaving,
  handleSavePlatformOps,
  handleSavePlatformAccent,
  handleSavePlatformLocaleTimezone,
}: PlatformPreferencesTabProps) {
  return (
    <div className="space-y-6">
      <MaintenanceModeSection
        locale={locale}
        maintenanceMode={maintenanceMode}
        setMaintenanceMode={setMaintenanceMode}
        maintenanceMessage={maintenanceMessage}
        setMaintenanceMessage={setMaintenanceMessage}
        maintenanceStartsLocal={maintenanceStartsLocal}
        setMaintenanceStartsLocal={setMaintenanceStartsLocal}
        maintenanceEndsLocal={maintenanceEndsLocal}
        setMaintenanceEndsLocal={setMaintenanceEndsLocal}
        isSaving={isSaving}
        handleSavePlatformOps={handleSavePlatformOps}
      />

      <AnnouncementBannerSection
        locale={locale}
        announcementEnabled={announcementEnabled}
        setAnnouncementEnabled={setAnnouncementEnabled}
        announcementMessage={announcementMessage}
        setAnnouncementMessage={setAnnouncementMessage}
        announcementEventLocal={announcementEventLocal}
        setAnnouncementEventLocal={setAnnouncementEventLocal}
        announcementStartsLocal={announcementStartsLocal}
        setAnnouncementStartsLocal={setAnnouncementStartsLocal}
        announcementEndsLocal={announcementEndsLocal}
        setAnnouncementEndsLocal={setAnnouncementEndsLocal}
        announcementSeverity={announcementSeverity}
        setAnnouncementSeverity={setAnnouncementSeverity}
        announcementDismissible={announcementDismissible}
        setAnnouncementDismissible={setAnnouncementDismissible}
        isSaving={isSaving}
        handleSavePlatformOps={handleSavePlatformOps}
      />

      <SpotlightBannerSection
        locale={locale}
        eventBannerEnabled={eventBannerEnabled}
        setEventBannerEnabled={setEventBannerEnabled}
        eventBannerMode={eventBannerMode}
        setEventBannerMode={setEventBannerMode}
        eventBannerCriteria={eventBannerCriteria}
        setEventBannerCriteria={setEventBannerCriteria}
        eventBannerPinnedEventId={eventBannerPinnedEventId}
        setEventBannerPinnedEventId={setEventBannerPinnedEventId}
        eventBannerCustomBadge={eventBannerCustomBadge}
        setEventBannerCustomBadge={setEventBannerCustomBadge}
        eventBannerCustomText={eventBannerCustomText}
        setEventBannerCustomText={setEventBannerCustomText}
        spotlightPreview={spotlightPreview}
        isLoadingSpotlightPreview={isLoadingSpotlightPreview}
        adminPublishedEvents={adminPublishedEvents}
        isSaving={isSaving}
        handleSavePlatformOps={handleSavePlatformOps}
      />

      <PlatformAppearanceLocale
        locale={locale}
        initialPlatformSettings={initialPlatformSettings}
        platformAccentDraft={platformAccentDraft}
        setPlatformAccentDraft={setPlatformAccentDraft}
        platformDefaultAccent={platformDefaultAccent}
        platformLocaleDraft={platformLocaleDraft}
        setPlatformLocaleDraft={setPlatformLocaleDraft}
        platformTimezoneDraft={platformTimezoneDraft}
        setPlatformTimezoneDraft={setPlatformTimezoneDraft}
        previewClock={previewClock}
        isSaving={isSaving}
        handleSavePlatformAccent={handleSavePlatformAccent}
        handleSavePlatformLocaleTimezone={handleSavePlatformLocaleTimezone}
      />
    </div>
  );
}
