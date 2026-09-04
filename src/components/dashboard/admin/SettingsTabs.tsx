"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { toast } from "sonner";
import {
    User, Mail, Shield, Globe,
    Send, Bell, Building, Save, Loader2,
    Wifi, WifiOff, RefreshCw, Users, Copy, Server, Palette,
    Wrench, Megaphone, Clock, Check,
    CreditCard, Bus, Wallet, Ticket, UserPlus, CalendarDays, AlertTriangle,
    Sparkles, Flame, Zap, Eye, Star,
} from "lucide-react";
import {
    saveSystemSettingsAction,
    saveSmtpSettingsAction,
    testMailConnectionAction,
    sendTestEmailAction,
} from "@/actions/admin/settings";
import {
    getPublishedEventsForAdminAction,
    getSpotlightPreviewAction,
} from "@/actions/admin/event-spotlight";
import { EventSpotlightBanner } from "@/components/shared/EventSpotlightBanner";
import type { EventSpotlightData } from "@/services/events/event-spotlight.service";
import { saveEntitySettingsAction } from "@/actions/organizations";
import { OrgBrandingForm } from "@/components/dashboard/admin/OrgBrandingForm";
import type { SystemSettings } from "@/lib/settings";
import type { AnnouncementSeverity } from "@/lib/settings/platform-ops";
import {
    PLATFORM_TIMEZONE_OPTIONS,
    normalizePlatformLocale,
    normalizePlatformTimezone,
    DEFAULT_PLATFORM_TIMEZONE,
    getTimezoneDisplayLabel,
    getTimezoneOffsetLabel,
    formatDateTimeInTimezone,
} from "@/lib/settings/platform-locale";
import type { Locale } from "@/lib/i18n/core";
import { useRouter } from "next/navigation";
import {
    ACCENT_COLORS,
    clearAccentOverride,
    hasAccentOverride,
    DEFAULT_ACCENT_COLOR,
    isAccentColor,
    type AccentColor,
} from "./AccentColorInitializer";
import { PersonalAppearancePreferences } from "@/components/dashboard/appearance/PersonalAppearancePreferences";
import { usePersistedFormFields } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import {
    fromDatetimeLocalValue,
    toDatetimeLocalValue,
} from "@/lib/datetime/zoned-day";

type EntitySubTab = "profile" | "entity" | "appearance";
type PlatformSubTab = "identity" | "preferences" | "smtp" | "notifications";
type SettingsSection = "entity" | "platform";

interface SettingsTabsProps {
    isSuperAdmin: boolean;
    entityContext?: {
        organizationId: string;
        name: string;
        inviteCode: string;
        isOwner: boolean;
        logoUrl?: string | null;
        accentColor?: string | null;
        brandingEnabled?: boolean;
        whatsappNumber?: string | null;
        canUseBranding?: boolean;
    };
    initialPlatformSettings?: SystemSettings;
    /** Default de plataforma (también para roles sin acceso a settings globales). */
    platformDefaultAccent?: AccentColor;
    adminUser: {
        name: string;
        email: string;
        role: string;
    };
}

export function SettingsTabs({
    isSuperAdmin,
    entityContext,
    initialPlatformSettings,
    platformDefaultAccent: platformDefaultAccentProp,
    adminUser,
}: SettingsTabsProps) {
    const { locale, setLocale, isPending: isLocalePending } = useLocale();
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
            platformSupportEmail: initialPlatformSettings?.supportEmail ?? "",
            platformContactEmail: initialPlatformSettings?.publicContactEmail ?? "",
            platformLocation: initialPlatformSettings?.publicLocation ?? "",
            socialFacebook: initialPlatformSettings?.socialFacebook ?? "",
            socialInstagram: initialPlatformSettings?.socialInstagram ?? "",
            socialX: initialPlatformSettings?.socialX ?? "",
            socialLinkedIn: initialPlatformSettings?.socialLinkedIn ?? "",
            socialWhatsApp: initialPlatformSettings?.socialWhatsApp ?? "",
            socialYoutube: initialPlatformSettings?.socialYoutube ?? "",
            termsUrl: initialPlatformSettings?.termsUrl ?? "",
            privacyUrl: initialPlatformSettings?.privacyUrl ?? "",
            pushNotificationTitle: initialPlatformSettings?.pushNotificationTitle ?? "",
            alertPayments: initialPlatformSettings?.alertNewPayments ?? true,
            alertRegistrations: initialPlatformSettings?.alertNewRegistrations ?? true,
            alertTransport: initialPlatformSettings?.alertTransportCapacity ?? true,
            alertOrganizerRequests: initialPlatformSettings?.alertOrganizerRequests ?? true,
            alertEventPublished: initialPlatformSettings?.alertEventPublished ?? true,
            alertSubscriptionPastDue: initialPlatformSettings?.alertSubscriptionPastDue ?? true,
            alertFinance: initialPlatformSettings?.alertDailyFinanceSummary ?? false,
            testEmail: "",
        },
    );
    const {
        entityName,
        platformOrgName,
        platformSupportEmail,
        platformContactEmail,
        platformLocation,
        socialFacebook,
        socialInstagram,
        socialX,
        socialLinkedIn,
        socialWhatsApp,
        socialYoutube,
        termsUrl,
        privacyUrl,
        pushNotificationTitle,
        alertPayments,
        alertRegistrations,
        alertTransport,
        alertOrganizerRequests,
        alertEventPublished,
        alertSubscriptionPastDue,
        alertFinance,
        testEmail,
    } = settingsDraft;
    const [smtpStatus, setSmtpStatus] = useState<"idle" | "checking" | "connected" | "disconnected">("idle");
    const [smtpInfo, setSmtpInfo] = useState<{
        host?: string;
        port?: number;
        latencyMs?: number;
        error?: string;
        source?: string;
    } | null>(null);

    const [smtpUseCustom, setSmtpUseCustom] = useState(
        initialPlatformSettings?.smtpUseCustom ?? false,
    );
    const [smtpHost, setSmtpHost] = useState(initialPlatformSettings?.smtpHost ?? "");
    const [smtpPort, setSmtpPort] = useState(String(initialPlatformSettings?.smtpPort ?? 587));
    const [smtpUser, setSmtpUser] = useState(initialPlatformSettings?.smtpUser ?? "");
    const [smtpPassword, setSmtpPassword] = useState("");
    const [smtpFromEmail, setSmtpFromEmail] = useState(
        initialPlatformSettings?.smtpFromEmail ?? "",
    );
    const [smtpFromName, setSmtpFromName] = useState(
        initialPlatformSettings?.smtpFromName ?? "",
    );
    const [smtpPasswordSet, setSmtpPasswordSet] = useState(
        initialPlatformSettings?.smtpPasswordSet ?? false,
    );
    const [isTestingEmail, startTestingEmail] = useTransition();
    const [isSaving, startSaving] = useTransition();

    const platformDefaultAccent: AccentColor = isAccentColor(platformDefaultAccentProp)
        ? platformDefaultAccentProp
        : isAccentColor(initialPlatformSettings?.defaultAccentColor)
          ? initialPlatformSettings!.defaultAccentColor
          : DEFAULT_ACCENT_COLOR;

    const [platformAccentDraft, setPlatformAccentDraft] = useState<AccentColor>(platformDefaultAccent);

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

    // --- Estados para Banner Superior de Eventos (Spotlight) ---
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

    // Cargar lista de eventos publicados para el dropdown del Super Admin
    useEffect(() => {
        if (!isSuperAdmin) return;
        getPublishedEventsForAdminAction()
            .then((list) => setAdminPublishedEvents(list))
            .catch(() => setAdminPublishedEvents([]));
    }, [isSuperAdmin]);

    // Calcular preview dinámico en vivo
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
        normalizePlatformTimezone(
            initialPlatformSettings?.defaultTimezone ?? DEFAULT_PLATFORM_TIMEZONE,
        ),
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
        setMaintenanceStartsLocal(
            toDatetimeLocalValue(initialPlatformSettings.maintenanceStartsAt, tz),
        );
        setMaintenanceEndsLocal(
            toDatetimeLocalValue(initialPlatformSettings.maintenanceEndsAt, tz),
        );
        setAnnouncementStartsLocal(
            toDatetimeLocalValue(initialPlatformSettings.announcementStartsAt, tz),
        );
        setAnnouncementEndsLocal(
            toDatetimeLocalValue(initialPlatformSettings.announcementEndsAt, tz),
        );
        setAnnouncementEventLocal(
            toDatetimeLocalValue(initialPlatformSettings.announcementEventAt, tz),
        );
        setEventBannerEnabled(initialPlatformSettings.eventBannerEnabled ?? false);
        setEventBannerMode(initialPlatformSettings.eventBannerMode ?? "auto");
        setEventBannerCriteria(initialPlatformSettings.eventBannerCriteria ?? "auto");
        setEventBannerPinnedEventId(initialPlatformSettings.eventBannerPinnedEventId ?? "");
        setEventBannerCustomBadge(initialPlatformSettings.eventBannerCustomBadge ?? "");
        setEventBannerCustomText(initialPlatformSettings.eventBannerCustomText ?? "");
        setPlatformLocaleDraft(normalizePlatformLocale(initialPlatformSettings.defaultLocale));
        setPlatformTimezoneDraft(
            normalizePlatformTimezone(initialPlatformSettings.defaultTimezone),
        );
        setSmtpUseCustom(initialPlatformSettings.smtpUseCustom);
        setSmtpHost(initialPlatformSettings.smtpHost);
        setSmtpPort(String(initialPlatformSettings.smtpPort ?? 587));
        setSmtpUser(initialPlatformSettings.smtpUser);
        setSmtpFromEmail(initialPlatformSettings.smtpFromEmail);
        setSmtpFromName(initialPlatformSettings.smtpFromName);
        setSmtpPasswordSet(initialPlatformSettings.smtpPasswordSet);
        setSmtpPassword("");
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
        initialPlatformSettings?.smtpUseCustom,
        initialPlatformSettings?.smtpHost,
        initialPlatformSettings?.smtpPort,
        initialPlatformSettings?.smtpUser,
        initialPlatformSettings?.smtpFromEmail,
        initialPlatformSettings?.smtpFromName,
        initialPlatformSettings?.smtpPasswordSet,
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
            platformTimezoneDraft ||
                initialPlatformSettings?.defaultTimezone ||
                DEFAULT_PLATFORM_TIMEZONE,
        );

        const maintenanceStartsAt =
            fromDatetimeLocalValue(maintenanceStartsLocal, tz)?.toISOString() ?? null;
        const maintenanceEndsAt =
            fromDatetimeLocalValue(maintenanceEndsLocal, tz)?.toISOString() ?? null;
        const announcementStartsAt =
            fromDatetimeLocalValue(announcementStartsLocal, tz)?.toISOString() ?? null;
        const announcementEndsAt =
            fromDatetimeLocalValue(announcementEndsLocal, tz)?.toISOString() ?? null;
        const announcementEventAt =
            fromDatetimeLocalValue(announcementEventLocal, tz)?.toISOString() ?? null;

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

    const handleSaveEntity = () => {
        if (!entityName.trim()) {
            toast.error(locale === "en" ? "Entity name cannot be empty" : "El nombre de la entidad no puede estar vacío");
            return;
        }

        startSaving(async () => {
            try {
                const res = await saveEntitySettingsAction({ name: entityName });
                if (res.success) {
                    toast.success(locale === "en" ? "Entity settings saved" : "Configuración de entidad guardada");
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error";
                toast.error(message);
            }
        });
    };

    const handleSavePlatformIdentity = () => {
        if (!platformOrgName.trim()) {
            toast.error(locale === "en" ? "Platform name cannot be empty" : "El nombre de la plataforma no puede estar vacío");
            return;
        }
        if (!platformSupportEmail.trim() || !platformSupportEmail.includes("@")) {
            toast.error(locale === "en" ? "Please enter a valid support email" : "Por favor, ingresa un correo de soporte válido");
            return;
        }
        if (!platformContactEmail.trim() || !platformContactEmail.includes("@")) {
            toast.error(locale === "en" ? "Please enter a valid public contact email" : "Ingresa un correo público de contacto válido");
            return;
        }

        startSaving(async () => {
            try {
                const res = await saveSystemSettingsAction({
                    organizationName: platformOrgName,
                    supportEmail: platformSupportEmail,
                    publicContactEmail: platformContactEmail,
                    publicLocation: platformLocation,
                    socialFacebook,
                    socialInstagram,
                    socialX,
                    socialLinkedIn,
                    socialWhatsApp,
                    socialYoutube,
                    termsUrl,
                    privacyUrl,
                });
                if (res.success) {
                    toast.success(
                        locale === "en"
                            ? "Platform identity, contact & legal URLs saved"
                            : "Identidad, contacto y URLs legales guardados",
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

    const handleVerifySMTP = async () => {
        setSmtpStatus("checking");
        try {
            const res = await testMailConnectionAction();
            if (res.success) {
                setSmtpStatus("connected");
                setSmtpInfo({
                    host: res.host,
                    port: res.port,
                    latencyMs: res.latencyMs,
                    source: res.source,
                });
                toast.success(locale === "en" ? "SMTP connection test succeeded!" : "¡La prueba de conexión SMTP ha tenido éxito!");
            } else {
                setSmtpStatus("disconnected");
                setSmtpInfo({ error: res.error });
                toast.error(locale === "en" ? "SMTP connection failed" : "Conexión SMTP fallida");
            }
        } catch (err: unknown) {
            setSmtpStatus("disconnected");
            setSmtpInfo({ error: err instanceof Error ? err.message : "Error de conexión" });
            toast.error("SMTP verification failed");
        }
    };

    const handleSaveSmtp = () => {
        const portNum = Number.parseInt(smtpPort, 10);
        startSaving(async () => {
            try {
                const res = await saveSmtpSettingsAction({
                    smtpUseCustom,
                    smtpHost,
                    smtpPort: Number.isFinite(portNum) ? portNum : 587,
                    smtpUser,
                    smtpFromEmail,
                    smtpFromName,
                    smtpPassword: smtpPassword.trim() || undefined,
                });
                if (res.success) {
                    setSmtpPassword("");
                    setSmtpPasswordSet(res.settings.smtpPasswordSet);
                    toast.success(
                        locale === "en" ? "SMTP settings saved" : "Configuración SMTP guardada",
                    );
                    router.refresh();
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error";
                toast.error(message);
            }
        });
    };

    const handleSendTestEmail = (e: React.FormEvent) => {
        e.preventDefault();
        if (!testEmail.trim() || !testEmail.includes("@")) {
            toast.error(locale === "en" ? "Please enter a valid destination email" : "Por favor, ingresa un correo de destino válido");
            return;
        }

        startTestingEmail(async () => {
            try {
                const res = await sendTestEmailAction(testEmail);
                if (res.success) {
                    toast.success(
                        locale === "en"
                            ? `Diagnostic email sent in ${res.latencyMs}ms!`
                            : `¡Correo de diagnóstico enviado en ${res.latencyMs}ms!`,
                    );
                    setSettingsValue("testEmail", "");
                } else {
                    toast.error(res.error ?? "Failed to send");
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error";
                toast.error(message);
            }
        });
    };

    const copyInviteCode = () => {
        if (!entityContext) return;
        navigator.clipboard.writeText(entityContext.inviteCode);
        toast.success(t("dashboard.admin.inviteCodeCopied"));
    };

    const entityNav: { id: EntitySubTab; icon: typeof User; labelEs: string; labelEn: string }[] = [
        { id: "profile", icon: User, labelEs: "Mi cuenta", labelEn: "My account" },
        { id: "entity", icon: Building, labelEs: "Mi entidad", labelEn: "My entity" },
        { id: "appearance", icon: Globe, labelEs: "Preferencias", labelEn: "Preferences" },
    ];

    const platformNav: { id: PlatformSubTab; icon: typeof Server; labelEs: string; labelEn: string }[] = [
        { id: "identity", icon: Building, labelEs: "Identidad global", labelEn: "Global identity" },
        { id: "preferences", icon: Palette, labelEs: "Preferencias", labelEn: "Preferences" },
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
        <div className="space-y-6">
            {showEntity && showPlatform && (
                <div className="flex flex-wrap gap-2 p-1 rounded-xl border border-border bg-muted/30 w-fit">
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
                <p className="text-xs text-muted-foreground rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                    {locale === "en"
                        ? "Platform settings affect all tenants (emails, PDFs, global branding). Only super administrators can save changes."
                        : "La configuración de plataforma afecta a todos los inquilinos (correos, PDFs, marca global). Solo los superadministradores pueden guardar cambios."}
                </p>
            )}

            <div className="grid gap-8 lg:grid-cols-[250px_1fr] items-start">
                <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-border select-none whitespace-nowrap scrollbar-none">
                    {sideNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSubTab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setActiveSubTab(item.id)}
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-left ${
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

                <div className="space-y-6">
                    {section === "entity" && entitySubTab === "profile" && (
                        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4">
                                {locale === "en" ? "My Account Details" : "Detalles de mi Cuenta"}
                            </h2>
                            <div className="divide-y divide-border rounded-lg border border-border bg-muted/20">
                                <div className="flex items-center gap-4 p-4">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-muted-foreground">{t("common.fullName")}</p>
                                        <p className="font-medium text-foreground truncate">{adminUser.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-muted-foreground">{t("common.email")}</p>
                                        <p className="font-medium text-foreground break-all">{adminUser.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-muted-foreground">{t("common.role")}</p>
                                        <p className="font-medium text-foreground capitalize truncate">{adminUser.role}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {section === "entity" && entitySubTab === "entity" && entityContext && (
                        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {locale === "en" ? "Entity identity" : "Identidad de la entidad"}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {locale === "en"
                                        ? "Name and invite code for your organization. This is separate from global platform branding."
                                        : "Nombre y código de invitación de tu organización. Es independiente de la marca global de la plataforma."}
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    {locale === "en" ? "Entity name" : "Nombre de la entidad"}
                                </label>
                                <input
                                    type="text"
                                    value={entityName}
                                    onChange={(e) => setSettingsValue("entityName", e.target.value)}
                                    disabled={!entityContext.isOwner}
                                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-foreground transition-all disabled:opacity-60"
                                />
                                {!entityContext.isOwner && (
                                    <p className="text-xs text-muted-foreground">
                                        {locale === "en"
                                            ? "Only the entity owner can change the name."
                                            : "Solo el propietario de la entidad puede cambiar el nombre."}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    {t("dashboard.admin.inviteCodeLabel")}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={entityContext.inviteCode}
                                        className="flex-1 rounded-lg border border-border bg-muted/30 px-3.5 py-2 text-sm font-mono text-foreground"
                                    />
                                    <button
                                        type="button"
                                        onClick={copyInviteCode}
                                        className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted transition"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                        {locale === "en" ? "Copy" : "Copiar"}
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">{t("dashboard.admin.inviteCodeHelp")}</p>
                            </div>

                            <Link
                                href="/admin/team"
                                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                            >
                                <Users className="h-4 w-4" />
                                {locale === "en" ? "Manage team and organizers" : "Gestionar equipo y organizadores"}
                            </Link>

                            {entityContext.isOwner && (
                                <div className="pt-2 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleSaveEntity}
                                        disabled={isSaving}
                                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                        {locale === "en" ? "Save entity" : "Guardar entidad"}
                                    </button>
                                </div>
                            )}

                            {entityContext.isOwner ? (
                                <OrgBrandingForm
                                    locale={locale === "en" ? "en" : "es"}
                                    canUseBranding={Boolean(entityContext.canUseBranding)}
                                    initial={{
                                        logoUrl: entityContext.logoUrl ?? null,
                                        accentColor: entityContext.accentColor ?? null,
                                        brandingEnabled: Boolean(entityContext.brandingEnabled),
                                        whatsappNumber: entityContext.whatsappNumber ?? null,
                                        organizationName: entityContext.name,
                                    }}
                                />
                            ) : null}
                        </div>
                    )}

                    {section === "entity" && entitySubTab === "appearance" && (
                        <div className="space-y-6">
                            <PersonalAppearancePreferences
                                platformDefaultAccent={platformDefaultAccent}
                            />

                            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {locale === "en" ? "Panel language" : "Idioma de la interfaz"}
                                    </h2>
                                </div>
                                <div className="flex gap-3 pt-1 select-none">
                                    <button
                                        type="button"
                                        onClick={() => setLocale("es")}
                                        disabled={isLocalePending}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 disabled:opacity-50 ${
                                            locale === "es"
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border bg-background text-foreground hover:bg-muted"
                                        }`}
                                    >
                                        <span>🇪🇸</span>
                                        Español
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLocale("en")}
                                        disabled={isLocalePending}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 disabled:opacity-50 ${
                                            locale === "en"
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border bg-background text-foreground hover:bg-muted"
                                        }`}
                                    >
                                        <span>🇺🇸</span>
                                        English
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {section === "platform" && platformSubTab === "identity" && initialPlatformSettings && (
                        <div className="space-y-6">
                        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {locale === "en" ? "Global platform identity" : "Identidad global de la plataforma"}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {locale === "en"
                                        ? "Brand name and operational support email (system emails, tickets, sidebar)."
                                        : "Nombre de marca y correo operativo de soporte (correos del sistema, tickets, sidebar)."}
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Platform / brand name" : "Nombre de la plataforma / marca"}
                                    </label>
                                    <input
                                        type="text"
                                        value={platformOrgName}
                                        onChange={(e) => setSettingsValue("platformOrgName", e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Support email (operations)" : "Correo de soporte (operaciones)"}
                                    </label>
                                    <input
                                        type="email"
                                        value={platformSupportEmail}
                                        onChange={(e) => setSettingsValue("platformSupportEmail", e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        {locale === "en"
                                            ? "Used in welcome / system email footers."
                                            : "Se usa en el pie de correos de bienvenida y del sistema."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {locale === "en" ? "Public contact & social" : "Contacto público y redes"}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {locale === "en"
                                        ? "Shown on the public landing footer. Leave a social field empty to hide that network."
                                        : "Se muestra en el footer de la landing pública. Deja vacío un campo social para ocultar esa red."}
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Public contact email" : "Correo público de contacto"}
                                    </label>
                                    <input
                                        type="email"
                                        value={platformContactEmail}
                                        onChange={(e) => setSettingsValue("platformContactEmail", e.target.value)}
                                        placeholder="hola@tu-dominio.com"
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Location (optional)" : "Ubicación (opcional)"}
                                    </label>
                                    <input
                                        type="text"
                                        value={platformLocation}
                                        onChange={(e) => setSettingsValue("platformLocation", e.target.value)}
                                        placeholder={locale === "en" ? "City, Country" : "Ciudad, País"}
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {(
                                    [
                                        { key: "socialFacebook" as const, labelEs: "Facebook", labelEn: "Facebook", placeholder: "https://facebook.com/tu-pagina", value: socialFacebook },
                                        { key: "socialInstagram" as const, labelEs: "Instagram", labelEn: "Instagram", placeholder: "https://instagram.com/tu-cuenta", value: socialInstagram },
                                        { key: "socialX" as const, labelEs: "X (Twitter)", labelEn: "X (Twitter)", placeholder: "https://x.com/tu-cuenta", value: socialX },
                                        { key: "socialLinkedIn" as const, labelEs: "LinkedIn", labelEn: "LinkedIn", placeholder: "https://linkedin.com/company/…", value: socialLinkedIn },
                                        { key: "socialYoutube" as const, labelEs: "YouTube", labelEn: "YouTube", placeholder: "https://youtube.com/@tu-canal", value: socialYoutube },
                                        { key: "socialWhatsApp" as const, labelEs: "WhatsApp", labelEn: "WhatsApp", placeholder: "+51999999999 o https://wa.me/51…", value: socialWhatsApp },
                                    ] as const
                                ).map((field) => (
                                    <div key={field.key} className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            {locale === "en" ? field.labelEn : field.labelEs}
                                        </label>
                                        <input
                                            type="text"
                                            value={field.value}
                                            onChange={(e) => setSettingsValue(field.key, e.target.value)}
                                            placeholder={field.placeholder}
                                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSavePlatformIdentity}
                                    disabled={isSaving}
                                    className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    {locale === "en" ? "Save identity & contact" : "Guardar identidad y contacto"}
                                </button>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {locale === "en" ? "Legal pages" : "Páginas legales"}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {locale === "en"
                                        ? "Shown in the public footer and signup notice. Use a full URL or an internal path like /terms."
                                        : "Aparecen en el footer público y en el aviso de registro. Usa una URL completa o una ruta interna como /terms."}
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Terms of service URL" : "URL de términos de servicio"}
                                    </label>
                                    <input
                                        type="text"
                                        value={termsUrl ?? ""}
                                        onChange={(e) => setSettingsValue("termsUrl", e.target.value)}
                                        placeholder="https://…/terms  o  /terms"
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Privacy policy URL" : "URL de política de privacidad"}
                                    </label>
                                    <input
                                        type="text"
                                        value={privacyUrl ?? ""}
                                        onChange={(e) => setSettingsValue("privacyUrl", e.target.value)}
                                        placeholder="https://…/privacy  o  /privacy"
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                </div>
                            </div>

                            <div className="pt-1 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSavePlatformIdentity}
                                    disabled={isSaving}
                                    className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    {locale === "en" ? "Save legal URLs" : "Guardar URLs legales"}
                                </button>
                            </div>
                        </div>

                        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 sm:p-5">
                            <h3 className="text-sm font-semibold text-foreground">
                                {locale === "en" ? "Platform settings status" : "Estado de la configuración"}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {locale === "en"
                                    ? "Identity, legal URLs, accent, locale & timezone, maintenance, SMTP, push branding, system alerts (including daily finance digest) and DB backup are available."
                                    : "Identidad, URLs legales, acento, idioma/zona horaria, mantenimiento, SMTP, marca push, alertas (incluido resumen financiero diario) y backup BD están disponibles."}
                            </p>
                        </div>
                        </div>
                    )}

                    {section === "platform" && platformSubTab === "preferences" && initialPlatformSettings && (
                        <div className="space-y-6">
                            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                                        <Wrench className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg font-semibold text-foreground">
                                            {locale === "en" ? "Maintenance mode" : "Modo mantenimiento"}
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {locale === "en"
                                                ? "Manual switch or scheduled window. Super admins keep access; tickets and login stay available."
                                                : "Activación manual o ventana programada. Los superadmins conservan acceso; tickets e inicio de sesión siguen disponibles."}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setMaintenanceMode(!maintenanceMode)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                                            maintenanceMode ? "bg-amber-600" : "bg-muted-foreground/30"
                                        }`}
                                        aria-pressed={maintenanceMode}
                                        aria-label={locale === "en" ? "Toggle maintenance mode" : "Activar modo mantenimiento"}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                                maintenanceMode ? "translate-x-5" : "translate-x-0"
                                            }`}
                                        />
                                    </button>
                                </div>

                                {maintenanceMode && (
                                    <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
                                        {locale === "en"
                                            ? "Manual maintenance is ON — users are redirected to /maintenance until you turn this off."
                                            : "Mantenimiento manual ACTIVO — los usuarios van a /maintenance hasta que lo desactives."}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Message shown to users" : "Mensaje mostrado a los usuarios"}
                                    </label>
                                    <textarea
                                        value={maintenanceMessage}
                                        onChange={(e) => setMaintenanceMessage(e.target.value)}
                                        rows={3}
                                        maxLength={500}
                                        placeholder={
                                            locale === "en"
                                                ? "We are upgrading the platform. Back shortly…"
                                                : "Estamos mejorando la plataforma. Volvemos en breve…"
                                        }
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-y min-h-[80px]"
                                    />
                                    <p className="text-[11px] text-muted-foreground text-right">
                                        {maintenanceMessage.length}/500
                                    </p>
                                </div>

                                <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/[0.04] p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                                        <p className="text-xs font-semibold text-foreground">
                                            {locale === "en"
                                                ? "Scheduled window (optional)"
                                                : "Ventana programada (opcional)"}
                                        </p>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        {locale === "en"
                                            ? "Auto-activates maintenance between these times (platform timezone), even if the manual switch is off. Clear both to disable schedule."
                                            : "Activa el mantenimiento solo entre estas horas (zona de plataforma), aunque el interruptor manual esté apagado. Vacía ambos para quitar la programación."}
                                    </p>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-semibold text-foreground">
                                                {locale === "en" ? "Starts" : "Inicio"}
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={maintenanceStartsLocal}
                                                onChange={(e) => setMaintenanceStartsLocal(e.target.value)}
                                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-semibold text-foreground">
                                                {locale === "en" ? "Ends" : "Fin"}
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={maintenanceEndsLocal}
                                                onChange={(e) => setMaintenanceEndsLocal(e.target.value)}
                                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                            />
                                        </div>
                                    </div>
                                    {(maintenanceStartsLocal || maintenanceEndsLocal) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMaintenanceStartsLocal("");
                                                setMaintenanceEndsLocal("");
                                            }}
                                            className="text-[11px] font-semibold text-amber-800 dark:text-amber-200 underline-offset-2 hover:underline"
                                        >
                                            {locale === "en" ? "Clear schedule" : "Limpiar programación"}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
                                        <Megaphone className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg font-semibold text-foreground">
                                            {locale === "en" ? "Announcement banner" : "Banner de avisos"}
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {locale === "en"
                                                ? "Site-wide notice with optional schedule and event time (e.g. “maintenance on Jul 20 at 3pm”)."
                                                : "Aviso en toda la app con horario opcional y fecha del evento (ej. mantenimiento el 20 jul a las 15:00)."}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setAnnouncementEnabled(!announcementEnabled)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                                            announcementEnabled ? "bg-primary" : "bg-muted-foreground/30"
                                        }`}
                                        aria-pressed={announcementEnabled}
                                        aria-label={locale === "en" ? "Toggle announcement banner" : "Activar banner de avisos"}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                                announcementEnabled ? "translate-x-5" : "translate-x-0"
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Banner message" : "Mensaje del banner"}
                                    </label>
                                    <textarea
                                        value={announcementMessage}
                                        onChange={(e) => setAnnouncementMessage(e.target.value)}
                                        rows={2}
                                        maxLength={400}
                                        disabled={!announcementEnabled}
                                        placeholder={
                                            locale === "en"
                                                ? "We will perform platform maintenance. Expect brief interruptions."
                                                : "Realizaremos mantenimiento de plataforma. Puede haber interrupciones breves."
                                        }
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-y min-h-[64px] disabled:opacity-50"
                                    />
                                    <p className="text-[11px] text-muted-foreground text-right">
                                        {announcementMessage.length}/400
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground inline-flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        {locale === "en"
                                            ? "Highlighted event time (shown on banner)"
                                            : "Fecha/hora del evento (chip en el banner)"}
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={announcementEventLocal}
                                        onChange={(e) => setAnnouncementEventLocal(e.target.value)}
                                        disabled={!announcementEnabled}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        {locale === "en"
                                            ? "Example: Jul 20, 3:00 PM — users see the date + relative time (“in 2 days”)."
                                            : "Ejemplo: 20 jul, 15:00 — el usuario ve la fecha y el tiempo relativo (“en 2 días”)."}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                                    <p className="text-xs font-semibold text-foreground">
                                        {locale === "en"
                                            ? "When to show the banner"
                                            : "Cuándo mostrar el banner"}
                                    </p>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-semibold text-foreground">
                                                {locale === "en" ? "Show from" : "Mostrar desde"}
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={announcementStartsLocal}
                                                onChange={(e) => setAnnouncementStartsLocal(e.target.value)}
                                                disabled={!announcementEnabled}
                                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-semibold text-foreground">
                                                {locale === "en" ? "Hide after" : "Ocultar después de"}
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={announcementEndsLocal}
                                                onChange={(e) => setAnnouncementEndsLocal(e.target.value)}
                                                disabled={!announcementEnabled}
                                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        {locale === "en"
                                            ? "Leave empty to show whenever the banner is enabled. Times use the platform timezone."
                                            : "Vacío = se muestra mientras el banner esté activo. Las horas usan la zona horaria de la plataforma."}
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-foreground">
                                            {locale === "en" ? "Severity" : "Severidad"}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {(
                                                [
                                                    { id: "info", labelEs: "Info", labelEn: "Info" },
                                                    { id: "warning", labelEs: "Aviso", labelEn: "Warning" },
                                                    { id: "critical", labelEs: "Crítico", labelEn: "Critical" },
                                                ] as const
                                            ).map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    disabled={!announcementEnabled}
                                                    onClick={() => setAnnouncementSeverity(opt.id)}
                                                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                                                        announcementSeverity === opt.id
                                                            ? "border-primary bg-primary/10 text-primary"
                                                            : "border-border bg-background text-foreground hover:bg-muted"
                                                    }`}
                                                >
                                                    {locale === "en" ? opt.labelEn : opt.labelEs}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/10 p-3">
                                        <div>
                                            <p className="text-xs font-semibold text-foreground">
                                                {locale === "en" ? "Dismissible" : "Se puede cerrar"}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {locale === "en"
                                                    ? "Users can hide it for this browser session"
                                                    : "Los usuarios pueden ocultarlo en esta sesión"}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={!announcementEnabled}
                                            onClick={() => setAnnouncementDismissible(!announcementDismissible)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
                                                announcementDismissible ? "bg-primary" : "bg-muted-foreground/30"
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                                    announcementDismissible ? "translate-x-5" : "translate-x-0"
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-1 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleSavePlatformOps}
                                        disabled={isSaving}
                                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                        {locale === "en" ? "Save status & banner" : "Guardar estado y avisos"}
                                    </button>
                                </div>
                            </div>

                            {/* --- Card de Banner Superior de Eventos (Spotlight) --- */}
                            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-6">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-semibold text-foreground">
                                                {locale === "en" ? "Top Event Spotlight Banner" : "Banner Superior de Eventos (Spotlight)"}
                                            </h2>
                                            <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                                {locale === "en" ? "Dynamic" : "Dinámico"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {locale === "en"
                                                ? "Highlights a top event (most popular, starting soon, few tickets left, or pinned) in the header bar with high conversion."
                                                : "Muestra en la cabecera superior un evento destacado de forma automática (más popular, próximo, últimos cupos) o fijado por ti."}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEventBannerEnabled(!eventBannerEnabled)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                                            eventBannerEnabled ? "bg-primary" : "bg-muted-foreground/30"
                                        }`}
                                        aria-pressed={eventBannerEnabled}
                                        aria-label={locale === "en" ? "Toggle event spotlight banner" : "Activar banner de eventos"}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                                eventBannerEnabled ? "translate-x-5" : "translate-x-0"
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Vista Previa en Vivo */}
                                <div className="space-y-2 rounded-xl border border-dashed border-border/80 bg-muted/20 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                            <Eye className="h-3.5 w-3.5 text-primary" />
                                            {locale === "en" ? "Live preview" : "Vista previa en vivo"}
                                        </span>
                                        {isLoadingSpotlightPreview && (
                                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                                {locale === "en" ? "Updating preview..." : "Actualizando vista..."}
                                            </span>
                                        )}
                                    </div>
                                    <div className="pt-1">
                                        {spotlightPreview ? (
                                            <EventSpotlightBanner event={spotlightPreview} isPreview={true} />
                                        ) : (
                                            <div className="rounded-lg border border-border bg-background/50 p-4 text-center text-xs text-muted-foreground">
                                                {locale === "en"
                                                    ? "No active published event currently matches this configuration."
                                                    : "No hay eventos publicados activos que coincidan con esta configuración."}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Modo del Banner: Automático vs Fijado */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Selection Mode" : "Modo de Selección"}
                                    </label>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            disabled={!eventBannerEnabled}
                                            onClick={() => setEventBannerMode("auto")}
                                            className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition disabled:opacity-50 ${
                                                eventBannerMode === "auto"
                                                    ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                                                    : "border-border bg-background hover:bg-muted/40"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Zap className="h-4 w-4 text-primary" />
                                                <span className="text-xs font-bold text-foreground">
                                                    {locale === "en" ? "Smart Automatic" : "Automático Inteligente"}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                {locale === "en"
                                                    ? "The system automatically selects the best event based on live demand and dates."
                                                    : "El servidor detecta el mejor evento según demanda, fechas y cupos."}
                                            </p>
                                        </button>

                                        <button
                                            type="button"
                                            disabled={!eventBannerEnabled}
                                            onClick={() => setEventBannerMode("pinned")}
                                            className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition disabled:opacity-50 ${
                                                eventBannerMode === "pinned"
                                                    ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                                                    : "border-border bg-background hover:bg-muted/40"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Star className="h-4 w-4 text-amber-500" />
                                                <span className="text-xs font-bold text-foreground">
                                                    {locale === "en" ? "Pin Specific Event" : "Fijar Evento Específico (Manual)"}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                {locale === "en"
                                                    ? "Choose an exact event to promote (e.g. sponsored or main featured event)."
                                                    : "Tú eliges exactamente qué evento promocionar (ideal para patrocinados)."}
                                            </p>
                                        </button>
                                    </div>
                                </div>

                                {/* Opciones específicas de Modo Automático */}
                                {eventBannerMode === "auto" && (
                                    <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                                        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                            <Flame className="h-3.5 w-3.5 text-orange-500" />
                                            {locale === "en" ? "Preferred dynamic criterion" : "Criterio de prioridad dinámica"}
                                        </label>
                                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                            {(
                                                [
                                                    {
                                                        id: "auto",
                                                        labelEs: "Balanceado (Auto)",
                                                        labelEn: "Balanced (Auto)",
                                                        descEs: "Cupos > Próximo > Popular",
                                                    },
                                                    {
                                                        id: "few_tickets",
                                                        labelEs: "⚡ Últimos Cupos",
                                                        labelEn: "⚡ Few Tickets",
                                                        descEs: "Eventos con <15 cupos o 80% lleno",
                                                    },
                                                    {
                                                        id: "popular",
                                                        labelEs: "🔥 Más Popular",
                                                        labelEn: "🔥 Most Popular",
                                                        descEs: "Mayor interacción y registros",
                                                    },
                                                    {
                                                        id: "upcoming",
                                                        labelEs: "⏳ Próximo a Iniciar",
                                                        labelEn: "⏳ Starting Soon",
                                                        descEs: "Comienza en menos de 72h",
                                                    },
                                                ] as const
                                            ).map((item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    disabled={!eventBannerEnabled}
                                                    onClick={() => setEventBannerCriteria(item.id)}
                                                    className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition disabled:opacity-50 ${
                                                        eventBannerCriteria === item.id
                                                            ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                                                            : "border-border bg-background text-foreground hover:bg-muted/50"
                                                    }`}
                                                >
                                                    <span className="text-xs font-semibold">
                                                        {locale === "en" ? item.labelEn : item.labelEs}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-normal mt-0.5">
                                                        {item.descEs}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Opciones específicas de Modo Fijado */}
                                {eventBannerMode === "pinned" && (
                                    <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">
                                                {locale === "en" ? "Select published event" : "Selecciona el evento publicado"}
                                            </label>
                                            <select
                                                value={eventBannerPinnedEventId}
                                                onChange={(e) => setEventBannerPinnedEventId(e.target.value)}
                                                disabled={!eventBannerEnabled}
                                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                                            >
                                                <option value="">
                                                    {locale === "en" ? "— Select an event —" : "— Selecciona un evento —"}
                                                </option>
                                                {adminPublishedEvents.map((ev) => (
                                                    <option key={ev.id} value={ev.id}>
                                                        {ev.title} ({new Date(ev.date).toLocaleDateString(locale === "en" ? "en-US" : "es-PE")})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Personalización opcional de textos y badge */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            {locale === "en" ? "Custom Badge (Optional)" : "Insignia / Badge personalizado (Opcional)"}
                                        </label>
                                        <input
                                            type="text"
                                            value={eventBannerCustomBadge}
                                            onChange={(e) => setEventBannerCustomBadge(e.target.value)}
                                            disabled={!eventBannerEnabled}
                                            maxLength={40}
                                            placeholder={locale === "en" ? "e.g. ⭐ Featured Event" : "ej. ⭐ Evento Recomendado"}
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            {locale === "en"
                                                ? "Leave blank to use the automatic badge (e.g. 🔥 Most Popular)."
                                                : "Vacío = usa el badge dinámico del sistema (ej. 🔥 Más Popular)."}
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            {locale === "en" ? "Custom Highlight Text (Optional)" : "Mensaje de urgencia personalizado (Opcional)"}
                                        </label>
                                        <input
                                            type="text"
                                            value={eventBannerCustomText}
                                            onChange={(e) => setEventBannerCustomText(e.target.value)}
                                            disabled={!eventBannerEnabled}
                                            maxLength={100}
                                            placeholder={locale === "en" ? "e.g. Last 5 tickets with 20% OFF" : "ej. ¡Últimas 10 entradas disponibles!"}
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            {locale === "en"
                                                ? "Leave blank to display the automatically calculated spots/date."
                                                : "Vacío = muestra los cupos restantes o fecha calculada automáticamente."}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-1 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleSavePlatformOps}
                                        disabled={isSaving}
                                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50 shadow-sm"
                                    >
                                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                        {locale === "en" ? "Save event banner settings" : "Guardar banner de eventos"}
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {locale === "en"
                                            ? "Platform default accent"
                                            : "Color de acento por defecto (plataforma)"}
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {locale === "en"
                                            ? "Applies to all users who have not chosen a personal accent. Saved in the database."
                                            : "Aplica a todos los usuarios que no hayan elegido un color personal. Se guarda en la base de datos."}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-4 items-center">
                                    {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((key) => {
                                        const config = ACCENT_COLORS[key];
                                        const isSelected = platformAccentDraft === key;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setPlatformAccentDraft(key)}
                                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 hover:scale-103 ${
                                                    isSelected
                                                        ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                                                        : "border-border bg-background hover:border-primary/50"
                                                }`}
                                            >
                                                <span
                                                    className={`h-4.5 w-4.5 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${config.class} shadow-inner`}
                                                >
                                                    {isSelected && "✓"}
                                                </span>
                                                <span className="text-foreground text-xs font-semibold">{config.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="pt-1 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleSavePlatformAccent}
                                        disabled={isSaving || platformAccentDraft === platformDefaultAccent}
                                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                        {locale === "en" ? "Save platform accent" : "Guardar acento de plataforma"}
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Globe className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg font-semibold text-foreground">
                                            {locale === "en"
                                                ? "Platform language & reference timezone"
                                                : "Idioma y zona horaria de la plataforma"}
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {locale === "en"
                                                ? "Global defaults for new users, notification dispatches, event schedules, and the AI assistant."
                                                : "Configuración global que rige para nuevos usuarios, envíos de correo, fechas de eventos y el asistente Copilot IA."}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="space-y-2.5">
                                        <div>
                                            <p className="text-xs font-semibold text-foreground">
                                                {locale === "en" ? "Default language (new accounts)" : "Idioma base de plataforma"}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                {locale === "en"
                                                    ? "Initial language for visitors and newly registered accounts."
                                                    : "Idioma inicial para nuevos visitantes y cuentas registradas."}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {[
                                                {
                                                    id: "es" as const,
                                                    code: "ES",
                                                    label: "Español",
                                                    region: locale === "en" ? "LatAm & Spain" : "Latinoamérica y España",
                                                },
                                                {
                                                    id: "en" as const,
                                                    code: "EN",
                                                    label: "English",
                                                    region: locale === "en" ? "Global & US" : "Global e Internacional",
                                                },
                                            ].map((opt) => {
                                                const isSelected = platformLocaleDraft === opt.id;
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => setPlatformLocaleDraft(opt.id)}
                                                        className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition ${
                                                            isSelected
                                                                ? "border-primary bg-primary/10 text-primary ring-1 ring-primary shadow-sm"
                                                                : "border-border bg-background text-foreground hover:bg-muted/70"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold ${
                                                                isSelected
                                                                    ? "bg-primary text-primary-foreground"
                                                                    : "bg-muted text-muted-foreground"
                                                            }`}
                                                        >
                                                            {opt.code}
                                                        </span>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                                                                {opt.label}
                                                                {isSelected && (
                                                                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                                                                )}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground truncate">
                                                                {opt.region}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <div>
                                            <label
                                                htmlFor="platform-timezone"
                                                className="text-xs font-semibold text-foreground inline-flex items-center gap-1.5"
                                            >
                                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                {locale === "en" ? "Official platform timezone" : "Zona horaria oficial"}
                                            </label>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                {locale === "en"
                                                    ? "Applied to event schedules, reports, and AI Copilot queries."
                                                    : "Aplica al calendario de eventos, reportes y al Copilot IA."}
                                            </p>
                                        </div>
                                        <select
                                            id="platform-timezone"
                                            value={platformTimezoneDraft}
                                            onChange={(e) =>
                                                setPlatformTimezoneDraft(
                                                    normalizePlatformTimezone(e.target.value),
                                                )
                                            }
                                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                        >
                                            {PLATFORM_TIMEZONE_OPTIONS.map((tz) => (
                                                <option key={tz.value} value={tz.value}>
                                                    {getTimezoneDisplayLabel(tz, locale)}
                                                </option>
                                            ))}
                                            {!PLATFORM_TIMEZONE_OPTIONS.some(
                                                (tz) => tz.value === platformTimezoneDraft,
                                            ) ? (
                                                <option value={platformTimezoneDraft}>
                                                    {platformTimezoneDraft} ({getTimezoneOffsetLabel(platformTimezoneDraft)})
                                                </option>
                                            ) : null}
                                        </select>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-border/80 bg-muted/30 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-2 text-foreground min-w-0">
                                        <Clock className="h-4 w-4 text-primary shrink-0" />
                                        <span className="font-medium text-muted-foreground shrink-0">
                                            {locale === "en" ? "Active time preview:" : "Hora activa en esta zona:"}
                                        </span>
                                        <span className="font-mono text-foreground font-semibold truncate">
                                            {previewClock || "..."}
                                        </span>
                                    </div>
                                    <span className="inline-flex items-center self-start sm:self-auto rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                                        ● {locale === "en" ? "Copilot & platform synced" : "Copilot e informes sincronizados"}
                                    </span>
                                </div>

                                <div className="pt-1 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleSavePlatformLocaleTimezone}
                                        disabled={
                                            isSaving ||
                                            (platformLocaleDraft ===
                                                normalizePlatformLocale(
                                                    initialPlatformSettings.defaultLocale,
                                                ) &&
                                                platformTimezoneDraft ===
                                                    normalizePlatformTimezone(
                                                        initialPlatformSettings.defaultTimezone,
                                                    ))
                                        }
                                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                        {locale === "en"
                                            ? "Save language & timezone"
                                            : "Guardar idioma y zona horaria"}
                                    </button>
                                </div>
                            </div>

                            <PersonalAppearancePreferences
                                platformDefaultAccent={platformDefaultAccent}
                            />

                            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-3">
                                <p className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground leading-relaxed">
                                    {locale === "en"
                                        ? "Your personal interface language is controlled with ES / EN in the top bar. It overrides the platform default above for this browser only."
                                        : "Tu idioma personal se cambia con ES / EN en la barra superior. Solo afecta este navegador y tiene prioridad sobre el idioma por defecto de arriba."}
                                </p>
                            </div>
                        </div>
                    )}

                    {section === "platform" && platformSubTab === "smtp" && (
                        <div className="space-y-6">
                            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">
                                            {locale === "en" ? "SMTP credentials" : "Credenciales SMTP"}
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {locale === "en"
                                                ? "Override .env SMTP from the UI. Password is stored encrypted. Leave blank to keep the current password."
                                                : "Sustituye el SMTP de .env desde la UI. La contraseña se guarda cifrada. Déjala en blanco para conservar la actual."}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSmtpUseCustom(!smtpUseCustom)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                                            smtpUseCustom ? "bg-primary" : "bg-muted-foreground/30"
                                        }`}
                                        aria-pressed={smtpUseCustom}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                                smtpUseCustom ? "translate-x-5" : "translate-x-0"
                                            }`}
                                        />
                                    </button>
                                </div>

                                <p className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                                    {smtpUseCustom
                                        ? locale === "en"
                                            ? "Active source: database (UI). Env values are ignored while this is on."
                                            : "Origen activo: base de datos (UI). Las variables .env se ignoran mientras esté activo."
                                        : locale === "en"
                                          ? "Active source: environment variables (.env). Turn the switch on to edit from here."
                                          : "Origen activo: variables de entorno (.env). Activa el interruptor para editar desde aquí."}
                                </p>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <label className="text-xs font-semibold text-foreground">Host</label>
                                        <input
                                            type="text"
                                            value={smtpHost}
                                            onChange={(e) => setSmtpHost(e.target.value)}
                                            disabled={!smtpUseCustom}
                                            placeholder="smtp.resend.com"
                                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            {locale === "en" ? "Port" : "Puerto"}
                                        </label>
                                        <input
                                            type="number"
                                            value={smtpPort}
                                            onChange={(e) => setSmtpPort(e.target.value)}
                                            disabled={!smtpUseCustom}
                                            placeholder="587"
                                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            {locale === "en" ? "Username" : "Usuario"}
                                        </label>
                                        <input
                                            type="text"
                                            value={smtpUser}
                                            onChange={(e) => setSmtpUser(e.target.value)}
                                            disabled={!smtpUseCustom}
                                            autoComplete="off"
                                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <label className="text-xs font-semibold text-foreground">
                                            {locale === "en" ? "Password" : "Contraseña"}
                                        </label>
                                        <input
                                            type="password"
                                            value={smtpPassword}
                                            onChange={(e) => setSmtpPassword(e.target.value)}
                                            disabled={!smtpUseCustom}
                                            autoComplete="new-password"
                                            placeholder={
                                                smtpPasswordSet
                                                    ? locale === "en"
                                                        ? "•••••••• (leave blank to keep)"
                                                        : "•••••••• (dejar en blanco para no cambiar)"
                                                    : locale === "en"
                                                      ? "SMTP password"
                                                      : "Contraseña SMTP"
                                            }
                                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            {locale === "en" ? "From email" : "Correo remitente"}
                                        </label>
                                        <input
                                            type="email"
                                            value={smtpFromEmail}
                                            onChange={(e) => setSmtpFromEmail(e.target.value)}
                                            disabled={!smtpUseCustom}
                                            placeholder="noreply@tudominio.com"
                                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            {locale === "en" ? "From name" : "Nombre remitente"}
                                        </label>
                                        <input
                                            type="text"
                                            value={smtpFromName}
                                            onChange={(e) => setSmtpFromName(e.target.value)}
                                            disabled={!smtpUseCustom}
                                            placeholder="Enquiva"
                                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                <div className="pt-1 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleSaveSmtp}
                                        disabled={isSaving}
                                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                        {locale === "en" ? "Save SMTP" : "Guardar SMTP"}
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {locale === "en" ? "SMTP diagnostics" : "Diagnóstico SMTP"}
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {locale === "en"
                                            ? "Verify the active SMTP configuration (database or .env)."
                                            : "Verifica la configuración SMTP activa (base de datos o .env)."}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/10">
                                    <div className="flex items-center gap-3">
                                        {smtpStatus === "connected" ? (
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 text-green-500">
                                                <Wifi className="h-5 w-5" />
                                            </div>
                                        ) : smtpStatus === "disconnected" ? (
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500">
                                                <WifiOff className="h-5 w-5" />
                                            </div>
                                        ) : (
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                <RefreshCw className={`h-5 w-5 ${smtpStatus === "checking" ? "animate-spin" : ""}`} />
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                                {locale === "en" ? "Server connection" : "Estado del servidor"}
                                            </span>
                                            <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                                                {smtpStatus === "idle" && (locale === "en" ? "Not checked" : "Sin comprobar")}
                                                {smtpStatus === "checking" && (locale === "en" ? "Verifying..." : "Verificando...")}
                                                {smtpStatus === "connected" && (
                                                    <span className="text-green-600 dark:text-green-400">
                                                        {locale === "en" ? "Connected" : "Conectado"}
                                                    </span>
                                                )}
                                                {smtpStatus === "disconnected" && (
                                                    <span className="text-rose-600 dark:text-rose-400">
                                                        {locale === "en" ? "Offline" : "Desconectado"}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleVerifySMTP}
                                        disabled={smtpStatus === "checking"}
                                        className="flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2.5 text-xs transition duration-200 disabled:opacity-50"
                                    >
                                        {smtpStatus === "checking" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        {locale === "en" ? "Test SMTP connection" : "Verificar conexión SMTP"}
                                    </button>
                                </div>

                                {smtpInfo && (
                                    <div className="rounded-xl border border-border bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-300">
                                        <p className="font-bold text-slate-400 mb-2">
                                            {"// SMTP DIAGNOSTICS REPORT"}
                                        </p>
                                        {smtpInfo.error ? (
                                            <p className="text-rose-400">Error: {smtpInfo.error}</p>
                                        ) : (
                                            <div className="space-y-1">
                                                <p><span className="text-slate-500">host:</span> <span className="text-green-400">{smtpInfo.host}</span></p>
                                                <p><span className="text-slate-500">port:</span> <span className="text-green-400">{smtpInfo.port}</span></p>
                                                <p><span className="text-slate-500">source:</span> <span className="text-cyan-400">{smtpInfo.source ?? "—"}</span></p>
                                                <p><span className="text-slate-500">latency:</span> <span className="text-yellow-400">{smtpInfo.latencyMs}ms</span></p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <hr className="border-border" />

                                <form onSubmit={handleSendTestEmail} className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground">
                                            {locale === "en" ? "Send test email" : "Enviar correo de prueba"}
                                        </h3>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                                        <input
                                            type="email"
                                            value={testEmail}
                                            onChange={(e) => setSettingsValue("testEmail", e.target.value)}
                                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                            placeholder="ejemplo@correo.com"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isTestingEmail || !testEmail}
                                            className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2.5 text-xs transition duration-200 disabled:opacity-50 shrink-0"
                                        >
                                            {isTestingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                            {locale === "en" ? "Send test" : "Enviar prueba"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {section === "platform" && platformSubTab === "notifications" && (
                        <div className="space-y-6">
                            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Bell className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg font-semibold text-foreground">
                                            {locale === "en"
                                                ? "Push notification title"
                                                : "Título de notificaciones push"}
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {locale === "en"
                                                ? "Brand name shown as the OS notification title. Event details appear in the body. Leave empty to use your organization name."
                                                : "Nombre de marca que aparece como título en el sistema operativo. El detalle del evento va en el cuerpo. Déjalo vacío para usar el nombre de la organización."}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Display title" : "Título visible"}
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={64}
                                        value={pushNotificationTitle ?? ""}
                                        onChange={(e) =>
                                            setSettingsValue("pushNotificationTitle", e.target.value.slice(0, 64))
                                        }
                                        placeholder={
                                            (platformOrgName || initialPlatformSettings?.organizationName || "Enquiva").trim()
                                        }
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        {(pushNotificationTitle ?? "").trim().length}/64
                                        {locale === "en"
                                            ? " · Empty falls back to organization name"
                                            : " · Vacío usa el nombre de la organización"}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                                        {locale === "en" ? "Preview" : "Vista previa"}
                                    </p>
                                    <div className="mx-auto max-w-sm rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                                        <div className="flex items-start gap-3 px-3.5 py-3">
                                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
                                                {(
                                                    (pushNotificationTitle ?? "").trim() ||
                                                    (platformOrgName || initialPlatformSettings?.organizationName || "E").trim()
                                                )
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-0.5">
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <p className="truncate text-sm font-semibold text-foreground">
                                                        {(pushNotificationTitle ?? "").trim() ||
                                                            (platformOrgName ||
                                                                initialPlatformSettings?.organizationName ||
                                                                "Enquiva").trim()}
                                                    </p>
                                                    <span className="shrink-0 text-[10px] text-muted-foreground">
                                                        {locale === "en" ? "now" : "ahora"}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-medium text-foreground/90 line-clamp-1">
                                                    {locale === "en"
                                                        ? "Payment approved"
                                                        : "Pago aprobado"}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground line-clamp-2">
                                                    {locale === "en"
                                                        ? "Your payment for Summer Summit was confirmed."
                                                        : "Tu pago para Summer Summit fue confirmado."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {locale === "en" ? "System alert subscriptions" : "Suscripción de alertas del sistema"}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {locale === "en"
                                        ? "Choose which platform events notify super administrators. Each alert type uses its own color."
                                        : "Elige qué eventos de plataforma notifican a los superadministradores. Cada tipo tiene su color."}
                                </p>
                            </div>

                            <div className="space-y-3">
                                {(
                                    [
                                        {
                                            key: "payments",
                                            checked: alertPayments,
                                            onChange: () => setSettingsValue("alertPayments", !alertPayments),
                                            Icon: CreditCard,
                                            tone: {
                                                row: "border-emerald-500/25 bg-emerald-500/[0.06]",
                                                icon: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                                                toggleOn: "bg-emerald-600",
                                                chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                                            },
                                            chipEs: "Pagos",
                                            chipEn: "Payments",
                                            titleEs: "Nuevos pagos de eventos",
                                            titleEn: "New event payments",
                                            descEs:
                                                "Aviso cuando se registre un pago de entrada o transporte (Culqi, efectivo u otros medios).",
                                            descEn:
                                                "Alert when a ticket or transport payment is registered (Culqi, cash, or other methods).",
                                        },
                                        {
                                            key: "registrations",
                                            checked: alertRegistrations,
                                            onChange: () =>
                                                setSettingsValue("alertRegistrations", !alertRegistrations),
                                            Icon: Ticket,
                                            tone: {
                                                row: "border-violet-500/25 bg-violet-500/[0.06]",
                                                icon: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
                                                toggleOn: "bg-violet-600",
                                                chip: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
                                            },
                                            chipEs: "Registros",
                                            chipEn: "Registrations",
                                            titleEs: "Nuevos registros",
                                            titleEn: "New registrations",
                                            descEs: "Aviso cuando un asistente se inscriba en un evento.",
                                            descEn: "Alert when an attendee registers for an event.",
                                        },
                                        {
                                            key: "transport",
                                            checked: alertTransport,
                                            onChange: () => setSettingsValue("alertTransport", !alertTransport),
                                            Icon: Bus,
                                            tone: {
                                                row: "border-sky-500/25 bg-sky-500/[0.06]",
                                                icon: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
                                                toggleOn: "bg-sky-600",
                                                chip: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
                                            },
                                            chipEs: "Transporte",
                                            chipEn: "Transport",
                                            titleEs: "Aforo crítico de transporte (90%)",
                                            titleEn: "Transport route occupancy (90%)",
                                            descEs: "Alerta cuando una ruta alcance el 90% de capacidad.",
                                            descEn: "Alert when a route reaches 90% capacity.",
                                        },
                                        {
                                            key: "organizers",
                                            checked: alertOrganizerRequests,
                                            onChange: () =>
                                                setSettingsValue(
                                                    "alertOrganizerRequests",
                                                    !alertOrganizerRequests,
                                                ),
                                            Icon: UserPlus,
                                            tone: {
                                                row: "border-orange-500/25 bg-orange-500/[0.06]",
                                                icon: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
                                                toggleOn: "bg-orange-600",
                                                chip: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
                                            },
                                            chipEs: "Equipo",
                                            chipEn: "Team",
                                            titleEs: "Solicitudes de organizador",
                                            titleEn: "Organizer join requests",
                                            descEs:
                                                "Copia a superadmins cuando alguien pide unirse a una entidad como organizador.",
                                            descEn:
                                                "Also notify super admins when someone requests to join an entity as organizer.",
                                        },
                                        {
                                            key: "events",
                                            checked: alertEventPublished,
                                            onChange: () =>
                                                setSettingsValue("alertEventPublished", !alertEventPublished),
                                            Icon: CalendarDays,
                                            tone: {
                                                row: "border-blue-500/25 bg-blue-500/[0.06]",
                                                icon: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
                                                toggleOn: "bg-blue-600",
                                                chip: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
                                            },
                                            chipEs: "Eventos",
                                            chipEn: "Events",
                                            titleEs: "Eventos publicados",
                                            titleEn: "Events published",
                                            descEs: "Aviso de plataforma cuando se publica un evento nuevo.",
                                            descEn: "Platform alert when a new event is published.",
                                        },
                                        {
                                            key: "subscriptions",
                                            checked: alertSubscriptionPastDue,
                                            onChange: () =>
                                                setSettingsValue(
                                                    "alertSubscriptionPastDue",
                                                    !alertSubscriptionPastDue,
                                                ),
                                            Icon: AlertTriangle,
                                            tone: {
                                                row: "border-rose-500/25 bg-rose-500/[0.06]",
                                                icon: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
                                                toggleOn: "bg-rose-600",
                                                chip: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
                                            },
                                            chipEs: "SaaS",
                                            chipEn: "SaaS",
                                            titleEs: "Suscripciones en mora",
                                            titleEn: "Past-due subscriptions",
                                            descEs:
                                                "Alerta operativa cuando un plan de organizador pasa a past_due.",
                                            descEn:
                                                "Ops alert when an organizer plan becomes past_due.",
                                        },
                                        {
                                            key: "finance",
                                            checked: alertFinance,
                                            onChange: () => setSettingsValue("alertFinance", !alertFinance),
                                            Icon: Wallet,
                                            tone: {
                                                row: "border-amber-500/25 bg-amber-500/[0.06]",
                                                icon: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
                                                toggleOn: "bg-amber-600",
                                                chip: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
                                            },
                                            chipEs: "Finanzas",
                                            chipEn: "Finance",
                                            titleEs: "Resumen financiero diario",
                                            titleEn: "Daily financial summary",
                                            descEs:
                                                "Al inicio del día (zona horaria de plataforma) envía el balance del día anterior: eventos + SaaS.",
                                            descEn:
                                                "At the start of the day (platform timezone) sends yesterday's balance: events + SaaS.",
                                        },
                                    ] as const
                                ).map((alert) => (
                                    <div
                                        key={alert.key}
                                        className={`flex items-start sm:items-center justify-between gap-3 rounded-xl border p-4 transition-colors ${alert.tone.row}`}
                                    >
                                        <div className="flex min-w-0 flex-1 items-start gap-3">
                                            <div
                                                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${alert.tone.icon}`}
                                            >
                                                <alert.Icon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 space-y-1 pr-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {locale === "en" ? alert.titleEn : alert.titleEs}
                                                    </p>
                                                    <span
                                                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${alert.tone.chip}`}
                                                    >
                                                        {locale === "en" ? alert.chipEn : alert.chipEs}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {locale === "en" ? alert.descEn : alert.descEs}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={alert.onChange}
                                            aria-pressed={alert.checked}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                                                alert.checked ? alert.tone.toggleOn : "bg-muted-foreground/30"
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                                    alert.checked ? "translate-x-5" : "translate-x-0"
                                                }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSaveNotifications}
                                    disabled={isSaving}
                                    className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    {locale === "en" ? "Save push & alerts" : "Guardar push y alertas"}
                                </button>
                            </div>
                        </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
