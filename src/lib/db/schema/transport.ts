import { pgTable, text, timestamp, boolean, integer, pgEnum, uuid, index, uniqueIndex, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { events } from "./events";
import { registrations } from "./registrations";

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "approved",
  "rejected",
]);

export const transportBookingStatusEnum = pgEnum("transport_booking_status", [
  "pending",
  "confirmed",
  "cancelled",
]);

export const paymentMethodTypeEnum = pgEnum("payment_method_type", [
  "yape",
  "plin",
  "cash",
  "culqi",
]);

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
    stopId: uuid("stop_id"),
    bookedAt: timestamp("booked_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("transport_bookings_route_idx").on(t.routeId),
    index("transport_bookings_registration_idx").on(t.registrationId),
  ]
);

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
  gatewayProvider: text("gateway_provider"),
  gatewayChargeId: text("gateway_charge_id"),
  gatewayOrderId: text("gateway_order_id"),
  gatewayStatus: text("gateway_status"),
  platformFee: numeric("platform_fee", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("payments_registration_idx").on(t.registrationId),
  index("payments_status_idx").on(t.status),
  index("payments_gateway_charge_idx").on(t.gatewayChargeId),
  index("payments_gateway_order_idx").on(t.gatewayOrderId),
]);

export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** null = medios de la plataforma (cobro de licencias/planes SaaS) */
  organizerId: text("organizer_id").references(() => users.id, { onDelete: "cascade" }),
  type: paymentMethodTypeEnum("type").notNull(),
  label: text("label").notNull(),
  qrCodeUrl: text("qr_code_url"),
  phone: text("phone"),
  holderName: text("holder_name").notNull(),
  /** Llave pública Culqi del organizador (cobros de eventos). null = usa env de plataforma (solo scope platform). */
  culqiPublicKey: text("culqi_public_key"),
  /** Llave secreta Culqi — solo servidor, nunca al cliente. */
  culqiSecretKey: text("culqi_secret_key"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("payment_methods_organizer_idx").on(t.organizerId),
]);

export const transportStops = pgTable(
  "transport_stops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    routeId: uuid("route_id")
      .notNull()
      .references(() => transportRoutes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    latitude: text("latitude"),
    longitude: text("longitude"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("transport_stops_route_idx").on(t.routeId)]
);

export const eventPaymentMethods = pgTable(
  "event_payment_methods",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    paymentMethodId: uuid("payment_method_id")
      .notNull()
      .references(() => paymentMethods.id, { onDelete: "cascade" }),
  },
  (t) => [
    uniqueIndex("event_payment_methods_unique_idx").on(t.eventId, t.paymentMethodId),
  ]
);

export const transportRoutesRelations = relations(transportRoutes, ({ one, many }) => ({
  event: one(events, { fields: [transportRoutes.eventId], references: [events.id] }),
  bookings: many(transportBookings),
  stops: many(transportStops),
}));

export const transportBookingsRelations = relations(transportBookings, ({ one, many }) => ({
  route: one(transportRoutes, { fields: [transportBookings.routeId], references: [transportRoutes.id] }),
  registration: one(registrations, { fields: [transportBookings.registrationId], references: [registrations.id] }),
  user: one(users, { fields: [transportBookings.userId], references: [users.id] }),
  stop: one(transportStops, { fields: [transportBookings.stopId], references: [transportStops.id] }),
  payments: many(payments),
}));

export const transportStopsRelations = relations(transportStops, ({ one }) => ({
  route: one(transportRoutes, { fields: [transportStops.routeId], references: [transportRoutes.id] }),
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

export type TransportRoute = typeof transportRoutes.$inferSelect;
export type NewTransportRoute = typeof transportRoutes.$inferInsert;
export type TransportBooking = typeof transportBookings.$inferSelect;
export type NewTransportBooking = typeof transportBookings.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;
export type TransportStop = typeof transportStops.$inferSelect;
export type NewTransportStop = typeof transportStops.$inferInsert;
