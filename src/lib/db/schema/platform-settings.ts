import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { users } from "./auth";

/** Configuración global de plataforma (singleton: id = "default"). */
export const platformSettings = pgTable("platform_settings", {
  id: text("id").primaryKey().default("default"),
  organizationName: text("organization_name").notNull(),
  supportEmail: text("support_email").notNull(),
  alertNewPayments: boolean("alert_new_payments").notNull().default(true),
  alertTransportCapacity: boolean("alert_transport_capacity").notNull().default(true),
  alertDailyFinanceSummary: boolean("alert_daily_finance_summary").notNull().default(false),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PlatformSettingsRow = typeof platformSettings.$inferSelect;
