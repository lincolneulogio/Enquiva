import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { users } from "./auth";

/** Configuración global de plataforma (singleton: id = "default"). */
export const platformSettings = pgTable("platform_settings", {
  id: text("id").primaryKey().default("default"),
  organizationName: text("organization_name").notNull(),
  supportEmail: text("support_email").notNull(),
  /** Correo público (landing / contacto), distinto del soporte operativo. */
  publicContactEmail: text("public_contact_email").notNull().default("hola@evora.app"),
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
  /** Banner de aviso global (landing + paneles). */
  announcementEnabled: boolean("announcement_enabled").notNull().default(false),
  announcementMessage: text("announcement_message").notNull().default(""),
  /** info | warning | critical */
  announcementSeverity: text("announcement_severity").notNull().default("info"),
  announcementDismissible: boolean("announcement_dismissible").notNull().default(true),
  /** URLs legales (http(s) o ruta relativa tipo /terms). */
  termsUrl: text("terms_url").notNull().default(""),
  privacyUrl: text("privacy_url").notNull().default(""),
  /** Idioma por defecto de la plataforma (es|en) cuando el usuario no eligió cookie. */
  defaultLocale: text("default_locale").notNull().default("es"),
  /** Zona horaria IANA por defecto (ej. America/Lima). */
  defaultTimezone: text("default_timezone").notNull().default("America/Lima"),
  alertNewPayments: boolean("alert_new_payments").notNull().default(true),
  alertTransportCapacity: boolean("alert_transport_capacity").notNull().default(true),
  alertDailyFinanceSummary: boolean("alert_daily_finance_summary").notNull().default(false),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PlatformSettingsRow = typeof platformSettings.$inferSelect;
