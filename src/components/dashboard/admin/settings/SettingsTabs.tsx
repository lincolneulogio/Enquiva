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
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { SettingsTabsProps, EntitySubTab, PlatformSubTab } from "./types";
import { EntityProfileTab } from "./entity/EntityProfileTab";
import { EntityDetailsTab } from "./entity/EntityDetailsTab";
import { EntityAppearanceTab } from "./entity/EntityAppearanceTab";
import { PlatformIdentityTab } from "./platform/PlatformIdentityTab";
import { PlatformPreferencesTab } from "./platform/PlatformPreferencesTab";
import { PlatformImpactTab } from "./platform/PlatformImpactTab";
import { PlatformCertificatesTab } from "./platform/PlatformCertificatesTab";
import { PlatformSmtpTab } from "./platform/PlatformSmtpTab";
import { PlatformNotificationsTab } from "./platform/PlatformNotificationsTab";
import { useSettingsTabsState } from "./useSettingsTabsState";

export function SettingsTabs({
    isSuperAdmin,
    entityContext,
    initialPlatformSettings,
    platformDefaultAccent: platformDefaultAccentProp,
    adminUser,
}: SettingsTabsProps) {
    const t = useTranslations();
    const state = useSettingsTabsState({
        isSuperAdmin,
        entityContext,
        initialPlatformSettings,
        platformDefaultAccent: platformDefaultAccentProp,
        adminUser,
    });

    const {
        locale,
        section,
        setSection,
        showEntity,
        showPlatform,
        activeSubTab,
        setActiveSubTab,
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

    const entityNav: { id: EntitySubTab; icon: typeof User; labelEs: string; labelEn: string }[] = [
        { id: "profile", icon: User, labelEs: "Mi cuenta", labelEn: "My account" },
        { id: "entity", icon: Building, labelEs: "Mi entidad", labelEn: "My entity" },
        { id: "appearance", icon: Globe, labelEs: "Preferencias", labelEn: "Preferences" },
    ];

    const platformNav: { id: PlatformSubTab; icon: typeof Server; labelEs: string; labelEn: string }[] = [
        { id: "identity", icon: Building, labelEs: "Identidad global", labelEn: "Global identity" },
        { id: "preferences", icon: Palette, labelEs: "Preferencias", labelEn: "Preferences" },
        { id: "impact", icon: Sparkles, labelEs: "Métricas de portada", labelEn: "Landing metrics" },
        { id: "certificates", icon: Award, labelEs: "Sello de certificados", labelEn: "Certificate seal" },
        { id: "smtp", icon: Send, labelEs: "Correo SMTP", labelEn: "SMTP mail" },
        { id: "notifications", icon: Bell, labelEs: "Alertas del sistema", labelEn: "System alerts" },
    ];

    const sideNav = section === "entity" ? entityNav : platformNav;

    return (
        <div className="w-full min-w-0 max-w-full space-y-6">
            {showEntity && showPlatform && (
                <div className="flex flex-wrap gap-2 p-1 rounded-xl border border-border bg-muted/30 w-fit max-w-full">
                    <button
                        type="button"
                        onClick={() => setSection("entity")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            section === "entity"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Building className="h-4 w-4" />
                        {t("dashboard.admin.settingsSectionEntity")}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSection("platform")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            section === "platform"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Server className="h-4 w-4" />
                        {t("dashboard.admin.settingsSectionPlatform")}
                    </button>
                </div>
            )}

            {section === "platform" && showPlatform && (
                <p className="text-xs text-muted-foreground rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 w-full min-w-0">
                    {locale === "en"
                        ? "Platform settings affect all tenants (emails, PDFs, global branding). Only super administrators can save changes."
                        : "La configuración de plataforma afecta a todos los inquilinos (correos, PDFs, marca global). Solo los superadministradores pueden guardar cambios."}
                </p>
            )}

            <div className="grid w-full min-w-0 max-w-full gap-8 lg:grid-cols-[250px_minmax(0,1fr)] items-start">
                <div className="flex w-full min-w-0 max-w-full flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-border select-none whitespace-nowrap scrollbar-none">
                    {sideNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSubTab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setActiveSubTab(item.id)}
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
            </div>
        </div>
    );
}
