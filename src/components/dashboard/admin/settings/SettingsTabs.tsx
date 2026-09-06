"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { toast } from "sonner";
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
import { usePersistedFormFields } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { saveSystemSettingsAction } from "@/actions/admin/settings";
import {
    getPublishedEventsForAdminAction,
    getSpotlightPreviewAction,
} from "@/actions/admin/event-spotlight";
import type { EventSpotlightData } from "@/services/events/event-spotlight.service";
import type { AnnouncementSeverity } from "@/lib/settings/platform-ops";
import {
    normalizePlatformLocale,
    normalizePlatformTimezone,
    DEFAULT_PLATFORM_TIMEZONE,
    formatDateTimeInTimezone,
} from "@/lib/settings/platform-locale";
import type { Locale } from "@/lib/i18n/core";
import {
    DEFAULT_ACCENT_COLOR,
    isAccentColor,
    clearAccentOverride,
    hasAccentOverride,
    type AccentColor,
} from "@/components/dashboard/admin/AccentColorInitializer";
import {
    fromDatetimeLocalValue,
    toDatetimeLocalValue,
} from "@/lib/datetime/zoned-day";

// Subtab Components
import type { SettingsTabsProps, EntitySubTab, PlatformSubTab, SettingsSection } from "./types";
import { EntityProfileTab } from "./entity/EntityProfileTab";
import { EntityDetailsTab } from "./entity/EntityDetailsTab";
import { EntityAppearanceTab } from "./entity/EntityAppearanceTab";
import { PlatformIdentityTab } from "./platform/PlatformIdentityTab";
import { PlatformPreferencesTab } from "./platform/PlatformPreferencesTab";
import { PlatformImpactTab } from "./platform/PlatformImpactTab";
import { PlatformCertificatesTab } from "./platform/PlatformCertificatesTab";
import { PlatformSmtpTab } from "./platform/PlatformSmtpTab";
import { PlatformNotificationsTab } from "./platform/PlatformNotificationsTab";

export function SettingsTabs({
    isSuperAdmin,
    entityContext,
    initialPlatformSettings,
    platformDefaultAccent: platformDefaultAccentProp,
    adminUser,
}: SettingsTabsProps) {
    const { locale, setLocale } = useLocale();
    const t = useTranslations();
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

    const {
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
    } = settingsDraft;

    const [isSaving, startSaving] = useTransition();

    const platformDefaultAccent: AccentColor = isAccentColor(platformDefaultAccentProp)
        ? platformDefaultAccentProp
        : isAccentColor(initialPlatformSettings?.defaultAccentColor)
          ? initialPlatformSettings!.defaultAccentColor
          : DEFAULT_ACCENT_COLOR;

    const [platformAccentDraft, setPlatformAccentDraft] = useState<AccentColor>(platformDefaultAccent);

    const [maintenanceMode, setMaintenanceMode] = useState(initialPlatformSettings?.maintenanceMode ?? false);
    const [maintenanceMessage, setMaintenanceMessage] = useState(initialPlatformSettings?.maintenanceMessage ?? "");
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

    useEffect(() => {
        setPlatformAccentDraft(platformDefaultAccent);
    }, [platformDefaultAccent]);

    useEffect(() => {
        if (!initialPlatformSettings) return;
        setMaintenanceMode(initialPlatformSettings.maintenanceMode);
        setMaintenanceMessage(initialPlatformSettings.maintenanceMessage);
        setAnnouncementEnabled(initialPlatformSettings.announcementEnabled);
        setAnnouncementMessage(initialPlatformSettings.announcementMessage);
        setAnnouncementSeverity(initialPlatformSettings.announcementSeverity);
        setAnnouncementDismissible(initialPlatformSettings.announcementDismissible);
        const tz = normalizePlatformTimezone(initialPlatformSettings.defaultTimezone);
        setMaintenanceStartsLocal(toDatetimeLocalValue(initialPlatformSettings.maintenanceStartsAt, tz));
        setMaintenanceEndsLocal(toDatetimeLocalValue(initialPlatformSettings.maintenanceEndsAt, tz));
        setAnnouncementStartsLocal(toDatetimeLocalValue(initialPlatformSettings.announcementStartsAt, tz));
        setAnnouncementEndsLocal(toDatetimeLocalValue(initialPlatformSettings.announcementEndsAt, tz));
        setAnnouncementEventLocal(toDatetimeLocalValue(initialPlatformSettings.announcementEventAt, tz));
        setEventBannerEnabled(initialPlatformSettings.eventBannerEnabled ?? false);
        setEventBannerMode(initialPlatformSettings.eventBannerMode ?? "auto");
        setEventBannerCriteria(initialPlatformSettings.eventBannerCriteria ?? "auto");
        setEventBannerPinnedEventId(initialPlatformSettings.eventBannerPinnedEventId ?? "");
        setEventBannerCustomBadge(initialPlatformSettings.eventBannerCustomBadge ?? "");
        setEventBannerCustomText(initialPlatformSettings.eventBannerCustomText ?? "");
        setPlatformLocaleDraft(normalizePlatformLocale(initialPlatformSettings.defaultLocale));
        setPlatformTimezoneDraft(normalizePlatformTimezone(initialPlatformSettings.defaultTimezone));
    }, [
        initialPlatformSettings?.maintenanceMode,
        initialPlatformSettings?.maintenanceMessage,
        initialPlatformSettings?.maintenanceStartsAt,
        initialPlatformSettings?.maintenanceEndsAt,
        initialPlatformSettings?.announcementEnabled,
        initialPlatformSettings?.announcementMessage,
        initialPlatformSettings?.announcementSeverity,
        initialPlatformSettings?.announcementDismissible,
        initialPlatformSettings?.announcementStartsAt,
        initialPlatformSettings?.announcementEndsAt,
        initialPlatformSettings?.announcementEventAt,
        initialPlatformSettings?.eventBannerEnabled,
        initialPlatformSettings?.eventBannerMode,
        initialPlatformSettings?.eventBannerCriteria,
        initialPlatformSettings?.eventBannerPinnedEventId,
        initialPlatformSettings?.eventBannerCustomBadge,
        initialPlatformSettings?.eventBannerCustomText,
        initialPlatformSettings?.defaultLocale,
        initialPlatformSettings?.defaultTimezone,
    ]);

    const handleSavePlatformAccent = () => {
        startSaving(async () => {
            try {
                const res = await saveSystemSettingsAction({
                    defaultAccentColor: platformAccentDraft,
                });
                if (res.success) {
                    if (!hasAccentOverride()) {
                        clearAccentOverride(platformAccentDraft);
                    }
                    toast.success(
                        locale === "en"
                            ? "Platform default accent saved"
                            : "Color de acento por defecto guardado",
                    );
                    router.refresh();
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error";
                toast.error(message);
            }
        });
    };

    const handleSavePlatformLocaleTimezone = () => {
        startSaving(async () => {
            try {
                const res = await saveSystemSettingsAction({
                    defaultLocale: platformLocaleDraft,
                    defaultTimezone: platformTimezoneDraft,
                });
                if (res.success) {
                    if (platformLocaleDraft !== locale) {
                        setLocale(platformLocaleDraft);
                    }
                    toast.success(
                        locale === "en"
                            ? "Default language & timezone saved"
                            : "Idioma y zona horaria por defecto guardados",
                    );
                    router.refresh();
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error";
                toast.error(message);
            }
        });
    };

    const handleSavePlatformOps = () => {
        if (announcementEnabled && !announcementMessage.trim()) {
            toast.error(
                locale === "en"
                    ? "Write an announcement message or disable the banner"
                    : "Escribe el mensaje del aviso o desactiva el banner",
            );
            return;
        }

        const tz = normalizePlatformTimezone(
            platformTimezoneDraft || initialPlatformSettings?.defaultTimezone || DEFAULT_PLATFORM_TIMEZONE,
        );

        const maintenanceStartsAt = fromDatetimeLocalValue(maintenanceStartsLocal, tz)?.toISOString() ?? null;
        const maintenanceEndsAt = fromDatetimeLocalValue(maintenanceEndsLocal, tz)?.toISOString() ?? null;
        const announcementStartsAt = fromDatetimeLocalValue(announcementStartsLocal, tz)?.toISOString() ?? null;
        const announcementEndsAt = fromDatetimeLocalValue(announcementEndsLocal, tz)?.toISOString() ?? null;
        const announcementEventAt = fromDatetimeLocalValue(announcementEventLocal, tz)?.toISOString() ?? null;

        if (
            maintenanceStartsAt &&
            maintenanceEndsAt &&
            new Date(maintenanceEndsAt) <= new Date(maintenanceStartsAt)
        ) {
            toast.error(
                locale === "en"
                    ? "Maintenance end must be after the start"
                    : "El fin del mantenimiento debe ser posterior al inicio",
            );
            return;
        }
        if (
            announcementStartsAt &&
            announcementEndsAt &&
            new Date(announcementEndsAt) <= new Date(announcementStartsAt)
        ) {
            toast.error(
                locale === "en"
                    ? "Banner end must be after the start"
                    : "El fin del banner debe ser posterior al inicio",
            );
            return;
        }

        startSaving(async () => {
            try {
                const res = await saveSystemSettingsAction({
                    maintenanceMode,
                    maintenanceMessage: maintenanceMessage.trim(),
                    maintenanceStartsAt,
                    maintenanceEndsAt,
                    announcementEnabled,
                    announcementMessage: announcementMessage.trim(),
                    announcementSeverity,
                    announcementDismissible,
                    announcementStartsAt,
                    announcementEndsAt,
                    announcementEventAt,
                    eventBannerEnabled,
                    eventBannerMode,
                    eventBannerCriteria,
                    eventBannerPinnedEventId: eventBannerPinnedEventId || null,
                    eventBannerCustomBadge: eventBannerCustomBadge.trim(),
                    eventBannerCustomText: eventBannerCustomText.trim(),
                });
                if (res.success) {
                    toast.success(
                        locale === "en"
                            ? "Platform operations & event spotlight saved"
                            : "Avisos y banner de eventos guardados con éxito",
                    );
                    router.refresh();
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error";
                toast.error(message);
            }
        });
    };

    const handleSaveNotifications = () => {
        startSaving(async () => {
            try {
                const res = await saveSystemSettingsAction({
                    pushNotificationTitle: (pushNotificationTitle ?? "").trim().slice(0, 64),
                    alertNewPayments: alertPayments,
                    alertNewRegistrations: alertRegistrations,
                    alertTransportCapacity: alertTransport,
                    alertOrganizerRequests: alertOrganizerRequests,
                    alertEventPublished: alertEventPublished,
                    alertSubscriptionPastDue: alertSubscriptionPastDue,
                    alertDailyFinanceSummary: alertFinance,
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
                const message = err instanceof Error ? err.message : "Error";
                toast.error(message);
            }
        });
    };

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
    const activeSubTab = section === "entity" ? entitySubTab : platformSubTab;
    const setActiveSubTab = (id: string) => {
        if (section === "entity") setEntitySubTab(id as EntitySubTab);
        else setPlatformSubTab(id as PlatformSubTab);
    };

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
                    {section === "entity" && entitySubTab === "profile" && (
                        <EntityProfileTab adminUser={adminUser} />
                    )}

                    {section === "entity" && entitySubTab === "entity" && entityContext && (
                        <EntityDetailsTab
                            entityContext={entityContext}
                            initialEntityName={entityName}
                            onEntityNameChange={(name) => setSettingsValue("entityName", name)}
                        />
                    )}

                    {section === "entity" && entitySubTab === "appearance" && (
                        <EntityAppearanceTab platformDefaultAccent={platformDefaultAccent} />
                    )}

                    {section === "platform" && platformSubTab === "identity" && initialPlatformSettings && (
                        <PlatformIdentityTab initialPlatformSettings={initialPlatformSettings} />
                    )}

                    {section === "platform" && platformSubTab === "preferences" && initialPlatformSettings && (
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

                    {section === "platform" && platformSubTab === "impact" && initialPlatformSettings && (
                        <PlatformImpactTab initialPlatformSettings={initialPlatformSettings} />
                    )}

                    {section === "platform" && platformSubTab === "certificates" && (
                        <PlatformCertificatesTab locale={locale} />
                    )}

                    {section === "platform" && platformSubTab === "smtp" && initialPlatformSettings && (
                        <PlatformSmtpTab initialPlatformSettings={initialPlatformSettings} />
                    )}

                    {section === "platform" && platformSubTab === "notifications" && (
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
