import type { EventSpotlightData } from "@/services/events/event-spotlight.service";
import type { AnnouncementSeverity } from "@/lib/settings/platform-ops";
import type { AccentColor } from "@/components/dashboard/admin/AccentColorInitializer";
import type { SystemSettings } from "@/lib/settings";

export interface PlatformPreferencesTabProps {
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
  adminPublishedEvents: Array<{ id: string; title: string; slug?: string; date?: string }>;
  // Platform Appearance & Locale
  platformAccentDraft: AccentColor;
  setPlatformAccentDraft: (val: AccentColor) => void;
  platformDefaultAccent?: AccentColor;
  platformLocaleDraft: "es" | "en";
  setPlatformLocaleDraft: (val: "es" | "en") => void;
  platformTimezoneDraft: string;
  setPlatformTimezoneDraft: (val: string) => void;
  previewClock: string;
  // Saving states & actions
  isSaving: boolean;
  handleSavePlatformOps: (e?: any) => Promise<void> | void;
  handleSavePlatformAccent: () => Promise<void> | void;
  handleSavePlatformLocaleTimezone: (e?: any) => Promise<void> | void;
}

