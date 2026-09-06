"use client";

import React from "react";
import type { EventSpotlightData } from "@/services/events/event-spotlight.service";
import type { AnnouncementSeverity } from "@/lib/settings/platform-ops";
import type { AccentColor } from "@/components/dashboard/admin/AccentColorInitializer";
import type { SystemSettings } from "@/lib/settings";

import { MaintenanceModeSection } from "./preferences/MaintenanceModeSection";
import { AnnouncementBannerSection } from "./preferences/AnnouncementBannerSection";
import { SpotlightBannerSection } from "./preferences/SpotlightBannerSection";
import { PlatformAppearanceLocale } from "./preferences/PlatformAppearanceLocale";

interface PlatformPreferencesTabProps {
    locale: "es" | "en";
    initialPlatformSettings: SystemSettings;
    // Maintenance
    maintenanceMode: boolean;
    setMaintenanceMode: (val: boolean) => void;
    maintenanceMessage: string;
    setMaintenanceMessage: (val: string) => void;
    maintenanceStartsLocal: string;
    setMaintenanceStartsLocal: (val: string) => void;
    maintenanceEndsLocal: string;
    setMaintenanceEndsLocal: (val: string) => void;
    // Announcement
    announcementEnabled: boolean;
    setAnnouncementEnabled: (val: boolean) => void;
    announcementMessage: string;
    setAnnouncementMessage: (val: string) => void;
    announcementEventLocal: string;
    setAnnouncementEventLocal: (val: string) => void;
    announcementStartsLocal: string;
    setAnnouncementStartsLocal: (val: string) => void;
    announcementEndsLocal: string;
    setAnnouncementEndsLocal: (val: string) => void;
    announcementSeverity: AnnouncementSeverity;
    setAnnouncementSeverity: (val: AnnouncementSeverity) => void;
    announcementDismissible: boolean;
    setAnnouncementDismissible: (val: boolean) => void;
    // Spotlight Banner
    eventBannerEnabled: boolean;
    setEventBannerEnabled: (val: boolean) => void;
    eventBannerMode: "auto" | "pinned";
    setEventBannerMode: (val: "auto" | "pinned") => void;
    eventBannerCriteria: "auto" | "few_tickets" | "popular" | "upcoming";
    setEventBannerCriteria: (val: "auto" | "few_tickets" | "popular" | "upcoming") => void;
    eventBannerPinnedEventId: string;
    setEventBannerPinnedEventId: (val: string) => void;
    eventBannerCustomBadge: string;
    setEventBannerCustomBadge: (val: string) => void;
    eventBannerCustomText: string;
    setEventBannerCustomText: (val: string) => void;
    spotlightPreview: EventSpotlightData | null;
    isLoadingSpotlightPreview: boolean;
    adminPublishedEvents: Array<{ id: string; title: string; date: string }>;
    // Platform Accent
    platformAccentDraft: AccentColor;
    setPlatformAccentDraft: (val: AccentColor) => void;
    platformDefaultAccent?: AccentColor;
    // Locale & Timezone
    platformLocaleDraft: "es" | "en";
    setPlatformLocaleDraft: (val: "es" | "en") => void;
    platformTimezoneDraft: string;
    setPlatformTimezoneDraft: (val: string) => void;
    previewClock: string;
    // Handlers & State
    isSaving: boolean;
    handleSavePlatformOps: () => void;
    handleSavePlatformAccent: () => void;
    handleSavePlatformLocaleTimezone: () => void;
}

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
        <div className="w-full min-w-0 max-w-full space-y-6">
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
