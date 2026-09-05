import { pgTable, text, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { events } from "./events";

/** Configuración global de plataforma (singleton: id = "default"). */
export const platformSettings = pgTable("platform_settings", {
  id: text("id").primaryKey().default("default"),
  organizationName: text("organization_name").notNull(),
  supportEmail: text("support_email").notNull(),
  /** Correo público (landing / contacto), distinto del soporte operativo. */
  publicContactEmail: text("public_contact_email").notNull().default("hola@enquiva.app"),
  publicLocation: text("public_location").notNull().default(""),
  socialFacebook: text("social_facebook").notNull().default(""),
  socialInstagram: text("social_instagram").notNull().default(""),
  socialX: text("social_x").notNull().default(""),
  socialLinkedIn: text("social_linkedin").notNull().default(""),
  socialWhatsApp: text("social_whatsapp").notNull().default(""),
  socialYoutube: text("social_youtube").notNull().default(""),
  /** Color de acento por defecto de toda la plataforma (amber|emerald|rose|blue). */
  defaultAccentColor: text("default_accent_color").notNull().default("amber"),
  /** Modo mantenimiento: bloquea la app excepto superadmin y rutas excepcionadas. */
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  maintenanceMessage: text("maintenance_message").notNull().default(""),
  /** Ventana programada de mantenimiento (UTC); vacío = solo el toggle manual. */
  maintenanceStartsAt: timestamp("maintenance_starts_at"),
  maintenanceEndsAt: timestamp("maintenance_ends_at"),
  /** Banner de aviso global (landing + paneles). */
  announcementEnabled: boolean("announcement_enabled").notNull().default(false),
  announcementMessage: text("announcement_message").notNull().default(""),
  /** info | warning | critical */
  announcementSeverity: text("announcement_severity").notNull().default("info"),
  announcementDismissible: boolean("announcement_dismissible").notNull().default(true),
  /** Cuándo empezar / dejar de mostrar el banner. */
  announcementStartsAt: timestamp("announcement_starts_at"),
  announcementEndsAt: timestamp("announcement_ends_at"),
  /** Fecha/hora del evento anunciado (ej. inicio del mantenimiento). */
  announcementEventAt: timestamp("announcement_event_at"),
  /** Banner Superior Dinámico de Eventos (Spotlight) */
  eventBannerEnabled: boolean("event_banner_enabled").notNull().default(false),
  /** auto | pinned */
  eventBannerMode: text("event_banner_mode").notNull().default("auto"),
  /** auto | upcoming | popular | few_tickets */
  eventBannerCriteria: text("event_banner_criteria").notNull().default("auto"),
  /** ID del evento fijado si mode === 'pinned' */
  eventBannerPinnedEventId: uuid("event_banner_pinned_event_id").references(() => events.id, { onDelete: "set null" }),
  /** Badge personalizado (opcional) */
  eventBannerCustomBadge: text("event_banner_custom_badge").notNull().default(""),
  /** Texto personalizado destacado (opcional) */
  eventBannerCustomText: text("event_banner_custom_text").notNull().default(""),
  /** URLs legales (http(s) o ruta relativa tipo /terms). */
  termsUrl: text("terms_url").notNull().default(""),
  privacyUrl: text("privacy_url").notNull().default(""),
  /** Idioma por defecto de la plataforma (es|en) cuando el usuario no eligió cookie. */
  defaultLocale: text("default_locale").notNull().default("es"),
  /** Zona horaria IANA por defecto (ej. America/Lima). */
  defaultTimezone: text("default_timezone").notNull().default("America/Lima"),
  /** Si true, SMTP usa campos de BD en lugar de variables de entorno. */
  smtpUseCustom: boolean("smtp_use_custom").notNull().default(false),
  smtpHost: text("smtp_host").notNull().default(""),
  smtpPort: integer("smtp_port").notNull().default(587),
  smtpUser: text("smtp_user").notNull().default(""),
  /** Contraseña SMTP cifrada (AES-GCM); nunca exponer en API/UI. */
  smtpPassEncrypted: text("smtp_pass_encrypted").notNull().default(""),
  smtpFromEmail: text("smtp_from_email").notNull().default(""),
  smtpFromName: text("smtp_from_name").notNull().default(""),
  /** Título de marca en notificaciones push web (vacío = nombre de organización). */
  pushNotificationTitle: text("push_notification_title").notNull().default(""),
  alertNewPayments: boolean("alert_new_payments").notNull().default(true),
  alertNewRegistrations: boolean("alert_new_registrations").notNull().default(true),
  alertTransportCapacity: boolean("alert_transport_capacity").notNull().default(true),
  alertOrganizerRequests: boolean("alert_organizer_requests").notNull().default(true),
  alertEventPublished: boolean("alert_event_published").notNull().default(true),
  alertSubscriptionPastDue: boolean("alert_subscription_past_due").notNull().default(true),
  alertDailyFinanceSummary: boolean("alert_daily_finance_summary").notNull().default(false),
  /** Métricas y tarjetas de impacto en portada (landing) */
  impactCard1Title: text("impact_card_1_title").notNull().default("5+ años impulsando"),
  impactCard1Subtitle: text("impact_card_1_subtitle").notNull().default("Eventos de tecnología, negocios e innovación en Latinoamérica."),
  impactCard1ImageUrl: text("impact_card_1_image_url").notNull().default(""),
  impactCard2Title: text("impact_card_2_title").notNull().default("Más de 250 empresas"),
  impactCard2Subtitle: text("impact_card_2_subtitle").notNull().default("Ya patrocinan y reclutan talento activamente en nuestros eventos."),
  impactCard2ImageUrl: text("impact_card_2_image_url").notNull().default(""),
  impactSatisfactionRate: text("impact_satisfaction_rate").notNull().default("99.8%"),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PlatformSettingsRow = typeof platformSettings.$inferSelect;
