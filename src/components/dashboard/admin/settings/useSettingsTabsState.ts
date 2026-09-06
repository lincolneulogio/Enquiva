"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/providers/LocaleProvider";
import { toast } from "sonner";
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
import type { SettingsTabsProps, EntitySubTab, PlatformSubTab, SettingsSection } from "./types";

export function useSettingsTabsState({
    isSuperAdmin,
    entityContext,
    initialPlatformSettings,
    platformDefaultAccent: platformDefaultAccentProp,
}: SettingsTabsProps) {
    const { locale, setLocale } = useLocale();
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
    const [platformLocaleDraft, setPlatformLocaleDraft] = useState<Locale>(
        normalizePlatformLocale(initialPlatformSettings?.defaultLocale),
    );
    const [platformTimezoneDraft, setPlatformTimezoneDraft] = useState(
        normalizePlatformTimezone(initialPlatformSettings?.defaultTimezone ?? DEFAULT_PLATFORM_TIMEZONE),
    );
    const [previewClock, setPreviewClock] = useState<string>("");

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

        if (maintenanceStartsAt && maintenanceEndsAt && new Date(maintenanceEndsAt) <= new Date(maintenanceStartsAt)) {
            toast.error(
                locale === "en"
                    ? "Maintenance end must be after the start"
                    : "El fin del mantenimiento debe ser posterior al inicio",
            );
            return;
        }
        if (announcementStartsAt && announcementEndsAt && new Date(announcementEndsAt) <= new Date(announcementStartsAt)) {
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

    const activeSubTab = section === "entity" ? entitySubTab : platformSubTab;
    const setActiveSubTab = (id: string) => {
        if (section === "entity") setEntitySubTab(id as EntitySubTab);
        else setPlatformSubTab(id as PlatformSubTab);
    };

    return {
        locale,
        section,
        setSection,
        entitySubTab,
        platformSubTab,
        showEntity,
        showPlatform,
        activeSubTab,
        setActiveSubTab,
        settingsDraft,
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
        platformLocaleDraft,
        setPlatformLocaleDraft,
        platformTimezoneDraft,
        setPlatformTimezoneDraft,
        previewClock,
        handleSavePlatformAccent,
        handleSavePlatformLocaleTimezone,
        handleSavePlatformOps,
        handleSaveNotifications,
    };
}
