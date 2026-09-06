"use client";

import type { SettingsTabsProps } from "./types";
import { EntityProfileTab } from "./entity/EntityProfileTab";
import { EntityDetailsTab } from "./entity/EntityDetailsTab";
import { EntityAppearanceTab } from "./entity/EntityAppearanceTab";
import { PlatformIdentityTab } from "./platform/PlatformIdentityTab";
import { PlatformPreferencesTab } from "./platform/PlatformPreferencesTab";
import { PlatformImpactTab } from "./platform/PlatformImpactTab";
import { PlatformCertificatesTab } from "./platform/PlatformCertificatesTab";
import { PlatformSmtpTab } from "./platform/PlatformSmtpTab";
import { PlatformNotificationsTab } from "./platform/PlatformNotificationsTab";
import type { useSettingsTabsState } from "./useSettingsTabsState";

interface SettingsTabContentProps {
  state: ReturnType<typeof useSettingsTabsState>;
  entityContext: SettingsTabsProps["entityContext"];
  initialPlatformSettings: SettingsTabsProps["initialPlatformSettings"];
  adminUser: SettingsTabsProps["adminUser"];
}

export function SettingsTabContent({
  state,
  entityContext,
  initialPlatformSettings,
  adminUser,
}: SettingsTabContentProps) {
  const {
    locale,
    section,
    activeSubTab,
    setSettingsValue,
    entityName,
    platformOrgName,
    pushNotificationTitle,
    alertPayments,
    alertRegistrations,
    alertTransport,
    alertOrganizerRequests,
    alertEventPublished,
    alertSubscriptionPastDue,
    alertFinance,
    isSaving,
    platformDefaultAccent,
    platformAccentDraft,
    setPlatformAccentDraft,
    maintenanceMode, setMaintenanceMode,
    maintenanceMessage, setMaintenanceMessage,
    maintenanceStartsLocal, setMaintenanceStartsLocal,
    maintenanceEndsLocal, setMaintenanceEndsLocal,
    announcementEnabled, setAnnouncementEnabled,
    announcementMessage, setAnnouncementMessage,
    announcementSeverity, setAnnouncementSeverity,
    announcementDismissible, setAnnouncementDismissible,
    announcementStartsLocal, setAnnouncementStartsLocal,
    announcementEndsLocal, setAnnouncementEndsLocal,
    announcementEventLocal, setAnnouncementEventLocal,
    eventBannerEnabled, setEventBannerEnabled,
    eventBannerMode, setEventBannerMode,
    eventBannerCriteria, setEventBannerCriteria,
    eventBannerPinnedEventId, setEventBannerPinnedEventId,
    eventBannerCustomBadge, setEventBannerCustomBadge,
    eventBannerCustomText, setEventBannerCustomText,
    adminPublishedEvents,
    spotlightPreview,
    isLoadingSpotlightPreview,
    platformLocaleDraft, setPlatformLocaleDraft,
    platformTimezoneDraft, setPlatformTimezoneDraft,
    previewClock,
    handleSavePlatformAccent,
    handleSavePlatformLocaleTimezone,
    handleSavePlatformOps,
    handleSaveNotifications,
  } = state;

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      {section === "entity" && activeSubTab === "profile" && (
        <EntityProfileTab adminUser={adminUser} />
      )}

      {section === "entity" && activeSubTab === "entity" && entityContext && (
        <EntityDetailsTab
          entityContext={entityContext}
          initialEntityName={entityName}
          onEntityNameChange={(name) => setSettingsValue("entityName", name)}
        />
      )}

      {section === "entity" && activeSubTab === "appearance" && (
        <EntityAppearanceTab platformDefaultAccent={platformDefaultAccent} />
      )}

      {section === "platform" && activeSubTab === "identity" && initialPlatformSettings && (
        <PlatformIdentityTab initialPlatformSettings={initialPlatformSettings} />
      )}

      {section === "platform" && activeSubTab === "preferences" && initialPlatformSettings && (
        <PlatformPreferencesTab
          locale={locale}
          initialPlatformSettings={initialPlatformSettings}
          maintenanceMode={maintenanceMode}
          setMaintenanceMode={setMaintenanceMode}
          maintenanceMessage={maintenanceMessage}
          setMaintenanceMessage={setMaintenanceMessage}
          maintenanceStartsLocal={maintenanceStartsLocal}
          setMaintenanceStartsLocal={setMaintenanceStartsLocal}
          maintenanceEndsLocal={maintenanceEndsLocal}
          setMaintenanceEndsLocal={setMaintenanceEndsLocal}
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
          platformAccentDraft={platformAccentDraft}
          setPlatformAccentDraft={setPlatformAccentDraft}
          platformDefaultAccent={platformDefaultAccent}
          platformLocaleDraft={platformLocaleDraft}
          setPlatformLocaleDraft={setPlatformLocaleDraft}
          platformTimezoneDraft={platformTimezoneDraft}
          setPlatformTimezoneDraft={setPlatformTimezoneDraft}
          previewClock={previewClock}
          isSaving={isSaving}
          handleSavePlatformOps={handleSavePlatformOps}
          handleSavePlatformAccent={handleSavePlatformAccent}
          handleSavePlatformLocaleTimezone={handleSavePlatformLocaleTimezone}
        />
      )}

      {section === "platform" && activeSubTab === "impact" && initialPlatformSettings && (
        <PlatformImpactTab initialPlatformSettings={initialPlatformSettings} />
      )}

      {section === "platform" && activeSubTab === "certificates" && (
        <PlatformCertificatesTab locale={locale} />
      )}

      {section === "platform" && activeSubTab === "smtp" && initialPlatformSettings && (
        <PlatformSmtpTab initialPlatformSettings={initialPlatformSettings} />
      )}

      {section === "platform" && activeSubTab === "notifications" && (
        <PlatformNotificationsTab
          locale={locale}
          pushNotificationTitle={pushNotificationTitle}
          platformOrgName={platformOrgName}
          initialOrgName={initialPlatformSettings?.organizationName}
          alertPayments={alertPayments}
          alertRegistrations={alertRegistrations}
          alertTransport={alertTransport}
          alertOrganizerRequests={alertOrganizerRequests}
          alertEventPublished={alertEventPublished}
          alertSubscriptionPastDue={alertSubscriptionPastDue}
          alertFinance={alertFinance}
          setSettingsValue={(k, v) => setSettingsValue(k as any, v)}
          handleSaveNotifications={handleSaveNotifications}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
