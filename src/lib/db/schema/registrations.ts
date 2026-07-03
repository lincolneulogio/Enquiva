import { pgTable, text, timestamp, boolean, integer, pgEnum, uuid, index, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { events } from "./events";

export const registrationStatusEnum = pgEnum("registration_status", [
  "registered",
  "waitlisted",
  "checked_in",
  "cancelled",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "event_published",
  "registration_confirmed",
  "event_cancelled",
  "event_updated",
  "event_reminder",
  "waitlist_promoted",
  "payment_submitted",
  "payment_status_updated",
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "active",
  "used",
  "cancelled",
]);

export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: registrationStatusEnum("status").notNull().default("registered"),
    contactPhone: text("contact_phone"),
    qrCode: text("qr_code"),
    notes: text("notes"),
    registeredAt: timestamp("registered_at").notNull().defaultNow(),
    checkedInAt: timestamp("checked_in_at"),
  },
  (t) => [
    index("registrations_event_idx").on(t.eventId),
    index("registrations_user_idx").on(t.userId),
    uniqueIndex("registrations_event_user_unique_idx").on(t.eventId, t.userId),
  ]
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    read: boolean("read").notNull().default(false),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("notifications_user_idx").on(t.userId),
    index("notifications_read_idx").on(t.read),
  ]
);

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id")
    .notNull()
    .references(() => registrations.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  /** @deprecated Legacy — QR se genera on-demand vía resolveTicketQrDataUrl */
  qrCode: text("qr_code"),
  signature: text("signature"),
  status: ticketStatusEnum("status").notNull().default("active"),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  checkedInAt: timestamp("checked_in_at"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
}, (t) => [
  uniqueIndex("tickets_registration_unique_idx").on(t.registrationId),
  index("tickets_status_idx").on(t.status),
]);

export const scanLogs = pgTable("ticket_scan_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  scannedBy: text("scanned_by"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  result: text("result").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("ticket_scan_logs_ticket_idx").on(t.ticketId)]);

export const registrationsRelations = relations(registrations, ({ one, many }) => ({
  event: one(events, { fields: [registrations.eventId], references: [events.id] }),
  user: one(users, { fields: [registrations.userId], references: [users.id] }),
  ticket: one(tickets, {
    fields: [registrations.id],
    references: [tickets.registrationId],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  registration: one(registrations, {
    fields: [tickets.registrationId],
    references: [registrations.id],
  }),
}));

export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
