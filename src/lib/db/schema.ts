import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  pgEnum,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", [
  "super_admin",
  "admin",
  "organizer",
  "member",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "cancelled",
  "completed",
]);

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

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "approved",
  "rejected",
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "active",
  "used",
  "cancelled",
]);

export const transportBookingStatusEnum = pgEnum("transport_booking_status", [
  "pending",
  "confirmed",
  "cancelled",
]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: roleEnum("role").notNull().default("member"),
  bio: text("bio"),
  isActive: boolean("is_active").notNull().default(true),
  lastSeenAt: timestamp("last_seen_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Better Auth Tables ────────────────────────────────────────────────────────

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Events ───────────────────────────────────────────────────────────────────

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizerId: text("organizer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    coverImage: text("cover_image"),
    category: text("category").notNull().default("other"),
    date: timestamp("date").notNull(),
    endDate: timestamp("end_date"),
    location: text("location"),
    locationUrl: text("location_url"),
    isVirtual: boolean("is_virtual").notNull().default(false),
    virtualLink: text("virtual_link"),
    capacity: integer("capacity"),
    status: eventStatusEnum("status").notNull().default("draft"),
    isFeatured: boolean("is_featured").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    price: numeric("price", { precision: 10, scale: 2 }),
    hasTransport: boolean("has_transport").notNull().default(false),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("events_organizer_idx").on(t.organizerId),
    index("events_status_idx").on(t.status),
    index("events_date_idx").on(t.date),
    index("events_category_idx").on(t.category),
  ]
);

// ─── Registrations ────────────────────────────────────────────────────────────

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

// ─── Notifications ────────────────────────────────────────────────────────────

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

// ─── Event Attachments ────────────────────────────────────────────────────────

export const eventAttachments = pgTable("event_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id")
    .notNull()
    .references(() => registrations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  transportBookingId: uuid("transport_booking_id"),
  currency: text("currency").notNull().default("PEN"),
  method: text("method").notNull().default("manual"),
  reference: text("reference"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  receiptUrl: text("receipt_url"),
  receiptFileName: text("receipt_file_name"),
  notes: text("notes"),
  verifiedBy: text("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("payments_registration_idx").on(t.registrationId),
  index("payments_status_idx").on(t.status),
]);

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id")
    .notNull()
    .references(() => registrations.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  qrCode: text("qr_code").notNull(),
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

// ─── Transport ────────────────────────────────────────────────────────────────

export const transportRoutes = pgTable(
  "transport_routes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    departurePoint: text("departure_point").notNull(),
    departureTime: timestamp("departure_time").notNull(),
    returnTime: timestamp("return_time"),
    pricePerSeat: numeric("price_per_seat", { precision: 10, scale: 2 }).notNull().default("0"),
    totalSeats: integer("total_seats").notNull().default(0),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("transport_routes_event_idx").on(t.eventId)]
);

export const transportBookings = pgTable(
  "transport_bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    routeId: uuid("route_id")
      .notNull()
      .references(() => transportRoutes.id, { onDelete: "cascade" }),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registrations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    seats: integer("seats").notNull().default(1),
    status: transportBookingStatusEnum("status").notNull().default("pending"),
    notes: text("notes"),
    bookedAt: timestamp("booked_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("transport_bookings_route_idx").on(t.routeId),
    index("transport_bookings_registration_idx").on(t.registrationId),
  ]
);

// ─── Categories ──────────────────────────────────────────────────────────────

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  description: text("description"),
  colorClass: text("color_class").notNull().default("bg-gray-100 text-gray-800"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: text("created_by").references(() => users.id),
});

export type Category = typeof categories.$inferSelect;

// ─── Roles ────────────────────────────────────────────────────────────────────

export const roles = pgTable("roles", {
  name: text("name").primaryKey(), // "super_admin" | "admin" | "organizer" | "member"
  label: text("label").notNull(),
  description: text("description").notNull(),
  color: text("color").notNull().default("gray"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleName: text("role_name")
    .notNull()
    .references(() => roles.name, { onDelete: "cascade" }),
  permission: text("permission").notNull(),
  allowed: boolean("allowed").notNull().default(true),
  updatedBy: text("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("role_permissions_role_permission_unique_idx").on(t.roleName, t.permission),
  index("role_permissions_role_idx").on(t.roleName),
]);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  events: many(events),
  registrations: many(registrations),
  notifications: many(notifications),
  sessions: many(sessions),
  accounts: many(accounts),
  payments: many(payments),
  tickets: many(tickets),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, { fields: [events.organizerId], references: [users.id] }),
  registrations: many(registrations),
  attachments: many(eventAttachments),
}));

export const transportRoutesRelations = relations(transportRoutes, ({ one, many }) => ({
  event: one(events, { fields: [transportRoutes.eventId], references: [events.id] }),
  bookings: many(transportBookings),
}));

export const transportBookingsRelations = relations(transportBookings, ({ one, many }) => ({
  route: one(transportRoutes, { fields: [transportBookings.routeId], references: [transportRoutes.id] }),
  registration: one(registrations, { fields: [transportBookings.registrationId], references: [registrations.id] }),
  user: one(users, { fields: [transportBookings.userId], references: [users.id] }),
  payments: many(payments),
}));

export const registrationsRelations = relations(registrations, ({ one, many }) => ({
  event: one(events, { fields: [registrations.eventId], references: [events.id] }),
  user: one(users, { fields: [registrations.userId], references: [users.id] }),
  ticket: one(tickets, {
    fields: [registrations.id],
    references: [tickets.registrationId],
  }),
  payments: many(payments),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const eventAttachmentsRelations = relations(eventAttachments, ({ one }) => ({
  event: one(events, { fields: [eventAttachments.eventId], references: [events.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  registration: one(registrations, {
    fields: [payments.registrationId],
    references: [registrations.id],
  }),
  transportBooking: one(transportBookings, {
    fields: [payments.transportBookingId],
    references: [transportBookings.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  verifier: one(users, {
    fields: [payments.verifiedBy],
    references: [users.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  registration: one(registrations, {
    fields: [tickets.registrationId],
    references: [registrations.id],
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleName], references: [roles.name] }),
  updater: one(users, { fields: [rolePermissions.updatedBy], references: [users.id] }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type EventAttachment = typeof eventAttachments.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type TransportRoute = typeof transportRoutes.$inferSelect;
export type NewTransportRoute = typeof transportRoutes.$inferInsert;
export type TransportBooking = typeof transportBookings.$inferSelect;
export type NewTransportBooking = typeof transportBookings.$inferInsert;
