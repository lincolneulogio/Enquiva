import { pgTable, text, timestamp, boolean, pgEnum, uuid, index, uniqueIndex, numeric } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { users } from "./auth";
import { events } from "./events";
import { registrations } from "./registrations";
import { transportBookings } from "./transport";

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "approved",
  "rejected",
]);

export const paymentMethodTypeEnum = pgEnum("payment_method_type", [
  "yape",
  "plin",
  "cash",
  "culqi",
]);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id")
    .notNull()
    .references(() => registrations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  transportBookingId: uuid("transport_booking_id").references(() => transportBookings.id, {
    onDelete: "set null",
  }),
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
  uniqueIndex("payments_gateway_charge_uidx")
    .on(t.gatewayChargeId)
    .where(sql`${t.gatewayChargeId} IS NOT NULL`),
  uniqueIndex("payments_gateway_order_unique_idx")
    .on(t.gatewayOrderId)
    .where(sql`${t.gatewayOrderId} IS NOT NULL`),
  index("payments_transport_booking_idx").on(t.transportBookingId),
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

export const paymentsRelations = relations(payments, ({ one }) => ({
  registration: one(registrations, {
    fields: [payments.registrationId],
    references: [registrations.id],
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

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;
