import { pgTable, text, timestamp, boolean, integer, pgEnum, uuid, index, uniqueIndex, jsonb, type AnyPgColumn } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
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
  "organizer_request",
  "organizer_approved",
  "organizer_rejected",
  "subscription_alert",
  "transport_alert",
  "finance_digest",
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "active",
  "used",
  "cancelled",
]);

/**
 * Perfil de invitado (no es cuenta de auth).
 * La inscripción hija vive en `registrations` con `guestId` y `userId` null.
 */
export const registrationGuests = pgTable(
  "registration_guests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentRegistrationId: uuid("parent_registration_id")
      .notNull()
      .references((): AnyPgColumn => registrations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("registration_guests_parent_idx").on(t.parentRegistrationId)],
);

export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    /**
     * Titular / offline con cuenta. Null cuando es inscripción de invitado (`guestId`).
     */
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    /**
     * Perfil de invitado (sin fila en `users`).
     */
    guestId: uuid("guest_id").references((): AnyPgColumn => registrationGuests.id, {
      onDelete: "cascade",
    }),
    status: registrationStatusEnum("status").notNull().default("registered"),
    contactPhone: text("contact_phone"),
    notes: text("notes"),
    /**
     * Inscripciones hijas (invitados) apuntan al registro del titular.
     * Sustituye el vínculo frágil `[GUESTS:…]` en notes.
     */
    parentRegistrationId: uuid("parent_registration_id").references(
      (): AnyPgColumn => registrations.id,
      { onDelete: "cascade" },
    ),
    registeredAt: timestamp("registered_at").notNull().defaultNow(),
    checkedInAt: timestamp("checked_in_at"),
    /** Si hay pago pendiente: el cupo se libera al vencer si no pagó. */
    holdExpiresAt: timestamp("hold_expires_at"),
    /** Evita reenviar el recordatorio a mitad del plazo de pago. */
    holdReminderSentAt: timestamp("hold_reminder_sent_at"),
    /** Horario o turno específico seleccionado por el asistente (Opción A / Multi-horario) */
    selectedScheduleId: text("selected_schedule_id"),
    selectedScheduleLabel: text("selected_schedule_label"),
  },
  (t) => [
    index("registrations_event_idx").on(t.eventId),
    index("registrations_user_idx").on(t.userId),
    uniqueIndex("registrations_event_user_unique_idx")
      .on(t.eventId, t.userId)
      .where(sql`${t.userId} IS NOT NULL`),
    uniqueIndex("registrations_event_guest_unique_idx")
      .on(t.eventId, t.guestId)
      .where(sql`${t.guestId} IS NOT NULL`),
    index("registrations_hold_expires_idx").on(t.holdExpiresAt),
    index("registrations_parent_idx").on(t.parentRegistrationId),
    index("registrations_event_status_idx").on(t.eventId, t.status),
    index("registrations_guest_idx").on(t.guestId),
    index("registrations_selected_schedule_idx").on(t.eventId, t.selectedScheduleId),
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
    index("notifications_user_unread_idx")
      .on(t.userId)
      .where(sql`${t.read} = false`),
  ]
);

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id")
    .notNull()
    .references(() => registrations.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
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

export const registrationGuestsRelations = relations(registrationGuests, ({ one }) => ({
  parentRegistration: one(registrations, {
    fields: [registrationGuests.parentRegistrationId],
    references: [registrations.id],
  }),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  event: one(events, { fields: [registrations.eventId], references: [events.id] }),
  user: one(users, { fields: [registrations.userId], references: [users.id] }),
  guest: one(registrationGuests, {
    fields: [registrations.guestId],
    references: [registrationGuests.id],
  }),
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
export type RegistrationGuest = typeof registrationGuests.$inferSelect;
export type NewRegistrationGuest = typeof registrationGuests.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
