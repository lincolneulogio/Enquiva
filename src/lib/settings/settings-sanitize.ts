import { platformSettings } from "@/lib/db/schema";
import { normalizeHttpUrl, normalizeLegalUrl, normalizeWhatsAppLink } from "@/lib/brand/social";
import { DEFAULT_ACCENT_COLOR, isAccentColor } from "@/lib/brand/accent";
import { isAnnouncementSeverity } from "@/lib/settings/platform-ops";
import { normalizePlatformLocale, normalizePlatformTimezone } from "@/lib/settings/platform-locale";
import { normalizePushNotificationTitle } from "@/lib/push/branding";
import { DEFAULT_SETTINGS, normalizeOptionalIsoDate, type SystemSettings } from "./settings-types";

export function rowToSettings(row: typeof platformSettings.$inferSelect): SystemSettings {
  const accent = row.defaultAccentColor;
  return {
    organizationName: row.organizationName,
    supportEmail: row.supportEmail,
    publicContactEmail: row.publicContactEmail || DEFAULT_SETTINGS.publicContactEmail,
    publicLocation: row.publicLocation ?? "",
    socialFacebook: row.socialFacebook ?? "",
    socialInstagram: row.socialInstagram ?? "",
    socialX: row.socialX ?? "",
    socialLinkedIn: row.socialLinkedIn ?? "",
    socialWhatsApp: row.socialWhatsApp ?? "",
    socialYoutube: row.socialYoutube ?? "",
    defaultAccentColor: isAccentColor(accent) ? accent : DEFAULT_ACCENT_COLOR,
    maintenanceMode: Boolean(row.maintenanceMode),
    maintenanceMessage: row.maintenanceMessage ?? "",
    maintenanceStartsAt: row.maintenanceStartsAt?.toISOString() ?? null,
    maintenanceEndsAt: row.maintenanceEndsAt?.toISOString() ?? null,
    announcementEnabled: Boolean(row.announcementEnabled),
    announcementMessage: row.announcementMessage ?? "",
    announcementSeverity: isAnnouncementSeverity(row.announcementSeverity) ? row.announcementSeverity : "info",
    announcementDismissible: row.announcementDismissible !== false,
    announcementStartsAt: row.announcementStartsAt?.toISOString() ?? null,
    announcementEndsAt: row.announcementEndsAt?.toISOString() ?? null,
    announcementEventAt: row.announcementEventAt?.toISOString() ?? null,
    eventBannerEnabled: Boolean(row.eventBannerEnabled),
    eventBannerMode: row.eventBannerMode === "pinned" ? "pinned" : "auto",
    eventBannerCriteria: ["upcoming", "popular", "few_tickets"].includes(row.eventBannerCriteria as any)
      ? (row.eventBannerCriteria as "upcoming" | "popular" | "few_tickets") : "auto",
    eventBannerPinnedEventId: row.eventBannerPinnedEventId ?? null,
    eventBannerCustomBadge: row.eventBannerCustomBadge ?? "",
    eventBannerCustomText: row.eventBannerCustomText ?? "",
    termsUrl: row.termsUrl ?? "",
    privacyUrl: row.privacyUrl ?? "",
    defaultLocale: normalizePlatformLocale(row.defaultLocale),
    defaultTimezone: normalizePlatformTimezone(row.defaultTimezone),
    smtpUseCustom: Boolean(row.smtpUseCustom),
    smtpHost: row.smtpHost ?? "",
    smtpPort: Number(row.smtpPort) > 0 ? Number(row.smtpPort) : 587,
    smtpUser: row.smtpUser ?? "",
    smtpFromEmail: row.smtpFromEmail ?? "",
    smtpFromName: row.smtpFromName ?? "",
    smtpPasswordSet: Boolean(row.smtpPassEncrypted?.trim()),
    pushNotificationTitle: row.pushNotificationTitle ?? "",
    alertNewPayments: row.alertNewPayments,
    alertNewRegistrations: row.alertNewRegistrations !== false,
    alertTransportCapacity: row.alertTransportCapacity,
    alertOrganizerRequests: row.alertOrganizerRequests !== false,
    alertEventPublished: row.alertEventPublished !== false,
    alertSubscriptionPastDue: row.alertSubscriptionPastDue !== false,
    alertDailyFinanceSummary: row.alertDailyFinanceSummary,
    impactCard1Title: row.impactCard1Title || DEFAULT_SETTINGS.impactCard1Title,
    impactCard1Subtitle: row.impactCard1Subtitle || DEFAULT_SETTINGS.impactCard1Subtitle,
    impactCard1ImageUrl: row.impactCard1ImageUrl || DEFAULT_SETTINGS.impactCard1ImageUrl,
    impactCard2Title: row.impactCard2Title || DEFAULT_SETTINGS.impactCard2Title,
    impactCard2Subtitle: row.impactCard2Subtitle || DEFAULT_SETTINGS.impactCard2Subtitle,
    impactCard2ImageUrl: row.impactCard2ImageUrl || DEFAULT_SETTINGS.impactCard2ImageUrl,
    impactSatisfactionRate: row.impactSatisfactionRate || DEFAULT_SETTINGS.impactSatisfactionRate,
    certificateSealUrl: row.certificateSealUrl || DEFAULT_SETTINGS.certificateSealUrl,
  };
}

export function sanitizeSettingsPatch(settings: Partial<SystemSettings>): Partial<SystemSettings> {
  const next: Partial<SystemSettings> = { ...settings };

  if (typeof next.publicContactEmail === "string") next.publicContactEmail = next.publicContactEmail.trim();
  if (typeof next.supportEmail === "string") next.supportEmail = next.supportEmail.trim();
  if (typeof next.organizationName === "string") next.organizationName = next.organizationName.trim();
  if (typeof next.publicLocation === "string") next.publicLocation = next.publicLocation.trim();
  if (typeof next.socialFacebook === "string") next.socialFacebook = normalizeHttpUrl(next.socialFacebook);
  if (typeof next.socialInstagram === "string") next.socialInstagram = normalizeHttpUrl(next.socialInstagram);
  if (typeof next.socialX === "string") next.socialX = normalizeHttpUrl(next.socialX);
  if (typeof next.socialLinkedIn === "string") next.socialLinkedIn = normalizeHttpUrl(next.socialLinkedIn);
  if (typeof next.socialYoutube === "string") next.socialYoutube = normalizeHttpUrl(next.socialYoutube);
  if (typeof next.socialWhatsApp === "string") next.socialWhatsApp = normalizeWhatsAppLink(next.socialWhatsApp);
  if (typeof next.defaultAccentColor === "string") {
    next.defaultAccentColor = isAccentColor(next.defaultAccentColor) ? next.defaultAccentColor : DEFAULT_ACCENT_COLOR;
  }
  if (typeof next.maintenanceMessage === "string") next.maintenanceMessage = next.maintenanceMessage.trim().slice(0, 500);
  if (typeof next.announcementMessage === "string") next.announcementMessage = next.announcementMessage.trim().slice(0, 400);
  if (typeof next.announcementSeverity === "string") {
    next.announcementSeverity = isAnnouncementSeverity(next.announcementSeverity) ? next.announcementSeverity : "info";
  }
  for (const key of [
    "maintenanceStartsAt", "maintenanceEndsAt", "announcementStartsAt", "announcementEndsAt", "announcementEventAt",
  ] as const) {
    if (key in next) next[key] = normalizeOptionalIsoDate(next[key]);
  }
  if (typeof next.termsUrl === "string") next.termsUrl = normalizeLegalUrl(next.termsUrl);
  if (typeof next.privacyUrl === "string") next.privacyUrl = normalizeLegalUrl(next.privacyUrl);
  if (typeof next.eventBannerPinnedEventId === "string" || next.eventBannerPinnedEventId === null) {
    next.eventBannerPinnedEventId = next.eventBannerPinnedEventId || null;
  }
  if (typeof next.eventBannerCustomBadge === "string") {
    next.eventBannerCustomBadge = next.eventBannerCustomBadge.trim().slice(0, 50);
  }
  if (typeof next.eventBannerCustomText === "string") {
    next.eventBannerCustomText = next.eventBannerCustomText.trim().slice(0, 200);
  }
  if (typeof next.defaultLocale === "string") next.defaultLocale = normalizePlatformLocale(next.defaultLocale);
  if (typeof next.defaultTimezone === "string") next.defaultTimezone = normalizePlatformTimezone(next.defaultTimezone);

  delete (next as { smtpPasswordSet?: boolean }).smtpPasswordSet;

  if (typeof next.smtpHost === "string") next.smtpHost = next.smtpHost.trim();
  if (typeof next.smtpUser === "string") next.smtpUser = next.smtpUser.trim();
  if (typeof next.smtpFromEmail === "string") next.smtpFromEmail = next.smtpFromEmail.trim();
  if (typeof next.smtpFromName === "string") next.smtpFromName = next.smtpFromName.trim();
  if (typeof next.smtpPort === "number") {
    next.smtpPort = Number.isFinite(next.smtpPort) && next.smtpPort > 0 ? Math.round(next.smtpPort) : 587;
  }
  if (typeof next.pushNotificationTitle === "string") {
    next.pushNotificationTitle = normalizePushNotificationTitle(next.pushNotificationTitle);
  }
  if (typeof next.impactCard1Title === "string") next.impactCard1Title = next.impactCard1Title.trim().slice(0, 100);
  if (typeof next.impactCard1Subtitle === "string") next.impactCard1Subtitle = next.impactCard1Subtitle.trim().slice(0, 250);
  if (typeof next.impactCard1ImageUrl === "string") next.impactCard1ImageUrl = next.impactCard1ImageUrl.trim();
  if (typeof next.impactCard2Title === "string") next.impactCard2Title = next.impactCard2Title.trim().slice(0, 100);
  if (typeof next.impactCard2Subtitle === "string") next.impactCard2Subtitle = next.impactCard2Subtitle.trim().slice(0, 250);
  if (typeof next.impactCard2ImageUrl === "string") next.impactCard2ImageUrl = next.impactCard2ImageUrl.trim();
  if (typeof next.impactSatisfactionRate === "string") {
    next.impactSatisfactionRate = next.impactSatisfactionRate.trim().slice(0, 20);
  }
  if (typeof next.certificateSealUrl === "string") next.certificateSealUrl = next.certificateSealUrl.trim();

  return next;
}

export function toDbRow(
  settings: SystemSettings,
  smtpPassEncrypted: string,
): Omit<typeof platformSettings.$inferInsert, "id" | "updatedAt" | "updatedBy"> {
  return {
    organizationName: settings.organizationName,
    supportEmail: settings.supportEmail,
    publicContactEmail: settings.publicContactEmail,
    publicLocation: settings.publicLocation,
    socialFacebook: settings.socialFacebook,
    socialInstagram: settings.socialInstagram,
    socialX: settings.socialX,
    socialLinkedIn: settings.socialLinkedIn,
    socialWhatsApp: settings.socialWhatsApp,
    socialYoutube: settings.socialYoutube,
    defaultAccentColor: settings.defaultAccentColor,
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
    maintenanceStartsAt: settings.maintenanceStartsAt ? new Date(settings.maintenanceStartsAt) : null,
    maintenanceEndsAt: settings.maintenanceEndsAt ? new Date(settings.maintenanceEndsAt) : null,
    announcementEnabled: settings.announcementEnabled,
    announcementMessage: settings.announcementMessage,
    announcementSeverity: settings.announcementSeverity,
    announcementDismissible: settings.announcementDismissible,
    announcementStartsAt: settings.announcementStartsAt ? new Date(settings.announcementStartsAt) : null,
    announcementEndsAt: settings.announcementEndsAt ? new Date(settings.announcementEndsAt) : null,
    announcementEventAt: settings.announcementEventAt ? new Date(settings.announcementEventAt) : null,
    eventBannerEnabled: settings.eventBannerEnabled,
    eventBannerMode: settings.eventBannerMode,
    eventBannerCriteria: settings.eventBannerCriteria,
    eventBannerPinnedEventId: settings.eventBannerPinnedEventId,
    eventBannerCustomBadge: settings.eventBannerCustomBadge,
    eventBannerCustomText: settings.eventBannerCustomText,
    termsUrl: settings.termsUrl,
    privacyUrl: settings.privacyUrl,
    defaultLocale: settings.defaultLocale,
    defaultTimezone: settings.defaultTimezone,
    smtpUseCustom: settings.smtpUseCustom,
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpUser: settings.smtpUser,
    smtpPassEncrypted,
    smtpFromEmail: settings.smtpFromEmail,
    smtpFromName: settings.smtpFromName,
    pushNotificationTitle: settings.pushNotificationTitle,
    alertNewPayments: settings.alertNewPayments,
    alertNewRegistrations: settings.alertNewRegistrations,
    alertTransportCapacity: settings.alertTransportCapacity,
    alertOrganizerRequests: settings.alertOrganizerRequests,
    alertEventPublished: settings.alertEventPublished,
    alertSubscriptionPastDue: settings.alertSubscriptionPastDue,
    alertDailyFinanceSummary: settings.alertDailyFinanceSummary,
    impactCard1Title: settings.impactCard1Title,
    impactCard1Subtitle: settings.impactCard1Subtitle,
    impactCard1ImageUrl: settings.impactCard1ImageUrl,
    impactCard2Title: settings.impactCard2Title,
    impactCard2Subtitle: settings.impactCard2Subtitle,
    impactCard2ImageUrl: settings.impactCard2ImageUrl,
    impactSatisfactionRate: settings.impactSatisfactionRate,
    certificateSealUrl: settings.certificateSealUrl || DEFAULT_SETTINGS.certificateSealUrl,
  };
}
