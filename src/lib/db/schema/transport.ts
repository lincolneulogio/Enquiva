import { pgTable, text, timestamp, boolean, integer, pgEnum, uuid, index, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { events } from "./events";
import { registrations } from "./registrations";

export const transportBookingStatusEnum = pgEnum("transport_booking_status", [
  "pending",
  "confirmed",
  "cancelled",
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
    /** Conductor / placa para manifiesto e impresión. */
    driverName: text("driver_name"),
    vehiclePlate: text("vehicle_plate"),
    /** true = ida y vuelta; false = solo ida. */
    isRoundTrip: boolean("is_round_trip").notNull().default(true),
    /** Horas para auto-cancelar bookings pending sin pago. */
    pendingHoldHours: integer("pending_hold_hours").notNull().default(24),
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
    stopId: uuid("stop_id").references(() => transportStops.id, {
      onDelete: "set null",
    }),
    bookedAt: timestamp("booked_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("transport_bookings_route_idx").on(t.routeId),
    index("transport_bookings_registration_idx").on(t.registrationId),
    index("transport_bookings_stop_idx").on(t.stopId),
    index("transport_bookings_status_booked_idx").on(t.status, t.bookedAt),
  ]
);

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
    /** Orden de recojo (1, 2, 3…). */
    sortOrder: integer("sort_order").notNull().default(0),
    /** Hora estimada de llegada al paradero. */
    estimatedArrivalTime: timestamp("estimated_arrival_time"),
    /** Cupo opcional por paradero (null = sin límite aparte del bus). */
    maxSeats: integer("max_seats"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("transport_stops_route_idx").on(t.routeId),
    index("transport_stops_route_sort_idx").on(t.routeId, t.sortOrder),
  ]
);

export const transportRoutesRelations = relations(transportRoutes, ({ one, many }) => ({
  event: one(events, { fields: [transportRoutes.eventId], references: [events.id] }),
  bookings: many(transportBookings),
  stops: many(transportStops),
}));

export const transportBookingsRelations = relations(transportBookings, ({ one }) => ({
  route: one(transportRoutes, { fields: [transportBookings.routeId], references: [transportRoutes.id] }),
  registration: one(registrations, { fields: [transportBookings.registrationId], references: [registrations.id] }),
  user: one(users, { fields: [transportBookings.userId], references: [users.id] }),
  stop: one(transportStops, { fields: [transportBookings.stopId], references: [transportStops.id] }),
}));

export const transportStopsRelations = relations(transportStops, ({ one }) => ({
  route: one(transportRoutes, { fields: [transportStops.routeId], references: [transportRoutes.id] }),
}));

export type TransportRoute = typeof transportRoutes.$inferSelect;
export type NewTransportRoute = typeof transportRoutes.$inferInsert;
export type TransportBooking = typeof transportBookings.$inferSelect;
export type NewTransportBooking = typeof transportBookings.$inferInsert;
export type TransportStop = typeof transportStops.$inferSelect;
export type NewTransportStop = typeof transportStops.$inferInsert;
